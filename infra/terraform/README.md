# Terraform (AWS)

AWS infrastructure for Job Tracker: VPC, EKS, RDS PostgreSQL, ECR, Secrets Manager and a GitHub Actions deploy role. The app itself is deployed with the Kustomize overlay in [`infra/k8s/overlays/eks`](../k8s/overlays/eks).

```
infra/terraform/
├── bootstrap/          # S3 bucket for the remote state (run once per account, local state)
├── modules/
│   ├── vpc/            # public, private and database subnets, NAT (terraform-aws-modules/vpc)
│   ├── eks/            # cluster, managed node group, add-ons (terraform-aws-modules/eks)
│   ├── rds/            # PostgreSQL, TLS enforced, reachable only from the nodes
│   ├── ecr/            # api, api-migrate and web repositories
│   ├── github-oidc/    # IAM role for GitHub Actions (OIDC, no stored keys)
│   └── k8s-platform/   # AWS Load Balancer Controller, External Secrets, app namespace, RBAC
└── envs/dev/           # the dev environment, wires the modules together
```

## Design

```
Internet ──► ALB (public subnets) ──► web pods ──► api pods ──► RDS (database subnets)
                                      └─ EKS nodes in private subnets, egress via NAT ─┘
```

- **Network:** 2 availability zones. Nodes run in private subnets. RDS runs in database subnets with no internet route, and its security group only accepts the EKS node security group. A single NAT gateway keeps dev cheap (`single_nat_gateway = false` gives one per AZ).
- **EKS:** managed node group (2 × t3.medium, AL2023). Add-ons: VPC CNI, kube-proxy, CoreDNS, metrics-server (for the HPAs) and the Pod Identity agent. The identity that runs Terraform becomes cluster admin through an access entry, and more admins can be added with `cluster_admin_arns`.
- **AWS access from pods** uses EKS Pod Identity instead of IRSA, so no OIDC provider or service account annotations are needed. The AWS Load Balancer Controller can manage ALBs. The External Secrets Operator can read only the app's secret.
- **Secrets:**
  - Terraform generates the database password and both JWT secrets as ephemeral values and passes them to write-only arguments (`password_wo`, `secret_string_wo`). They never appear in the plan or the state.
  - They're stored in one Secrets Manager secret (`job-tracker-dev/api`), which External Secrets copies into the `api-secrets` Kubernetes Secret.
  - Because Terraform can't read the values back, they are only (re)written when `secrets_version` changes.
- **ECR:** immutable tags (deploy by git SHA), scan on push, lifecycle policy that keeps the last 20 images.
- **GitHub Actions:**
  - The deploy role's trust policy only accepts `repo:<github_repository>:ref:refs/heads/main`.
  - In AWS, it can push to the three repositories and describe the cluster.
  - In the cluster it has no EKS access policy. It's mapped to the `job-tracker-deployers` group, which gets the `edit` role in the `job-tracker` namespace only.
- **State:** S3 bucket with versioning, encryption, blocked public access and TLS-only access. Locking uses S3 lock files (`use_lockfile`), so there's no DynamoDB table.

## Requirements

Terraform ≥ 1.11, AWS CLI v2 (also used by the Kubernetes providers to get a token), kubectl, kustomize and Docker.

```bash
winget install Hashicorp.Terraform Amazon.AWSCLI Kubernetes.kubectl Kubernetes.kustomize
aws configure   # or: aws configure sso && export AWS_PROFILE=...
```

## Cost

Roughly **$0.30/hour (~$7/day)** in eu-central-1 while running:
- EKS control plane: $0.10/h
- 2 × t3.medium nodes
- NAT gateway
- ALB
- db.t4g.micro
- Public IPv4 addresses, plus small amounts for KMS, Secrets Manager and CloudWatch logs

Set an [AWS Budget](https://console.aws.amazon.com/billing/home#/budgets) alert, and destroy the environment when you're not using it (see [Tear down](#tear-down)).

## Deploy

**1. State bucket (once per account)**

```bash
cd infra/terraform/bootstrap
terraform init
terraform apply          # prints state_bucket
```

**2. Infrastructure**

```bash
cd ../envs/dev
cp backend.hcl.example backend.hcl                 # set bucket to the state_bucket output
cp terraform.tfvars.example terraform.tfvars       # set github_repository
terraform init -backend-config=backend.hcl
terraform plan -out=tfplan
terraform apply tfplan                             # ~20 minutes, mostly EKS and RDS
aws eks update-kubeconfig --name job-tracker-dev --region eu-central-1
```

**3. Images.** Build with compose and push with the commit SHA as the tag:

```bash
REGISTRY=$(terraform output -raw ecr_registry)
TAG=$(git rev-parse --short HEAD)
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin $REGISTRY

docker compose build     # from the repository root
for image in api api-migrate web; do
  docker tag job-tracker-$image:local $REGISTRY/job-tracker/$image:$TAG
  docker push $REGISTRY/job-tracker/$image:$TAG
done
```

**4. App**

```bash
cd infra/k8s/overlays/eks
kustomize edit set image \
  job-tracker-api=$REGISTRY/job-tracker/api:$TAG \
  job-tracker-api-migrate=$REGISTRY/job-tracker/api-migrate:$TAG \
  job-tracker-web=$REGISTRY/job-tracker/web:$TAG
kubectl apply -k .
kubectl -n job-tracker rollout status deployment/api
kubectl -n job-tracker get ingress job-tracker     # ADDRESS is the ALB hostname
```

The ALB takes a few minutes to provision and pass its health checks. Then open `http://<ADDRESS>`. Don't commit the image changes that `kustomize edit` makes to `kustomization.yaml`; CI will set them on every deploy.

**Demo data.** RDS isn't reachable from outside the VPC, so run the seed in a one-off pod:

```bash
IMAGE=$REGISTRY/job-tracker/api-migrate:$TAG
kubectl -n job-tracker run seed --rm -i --restart=Never --image=$IMAGE --overrides='{"spec":{"securityContext":{"runAsNonRoot":true,"runAsUser":1000,"seccompProfile":{"type":"RuntimeDefault"}},"containers":[{"name":"seed","image":"'$IMAGE'","command":["npx","prisma","db","seed"],"envFrom":[{"secretRef":{"name":"api-secrets"}}],"env":[{"name":"HOME","value":"/tmp"},{"name":"CHECKPOINT_DISABLE","value":"1"}],"securityContext":{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]}}}]}}'
```

## Rotating secrets

Increase `secrets_version` (e.g. `-var secrets_version=2`) and apply. This writes a new database password and new JWT secrets, which logs every user out. Then make the pods pick up the new values: External Secrets refreshes the Secret within an hour, or right away with `kubectl -n job-tracker annotate externalsecret api-secrets force-sync=$(date +%s) --overwrite`, and then:

```bash
kubectl -n job-tracker rollout restart deployment/api
```

If the RDS instance is ever replaced, bump `secrets_version` in the same apply so the new instance and the secret get the same password.

## Tear down

Delete the app first, so the AWS Load Balancer Controller removes the ALB and its security groups. Otherwise they block the VPC from being deleted.

```bash
kubectl delete -k infra/k8s/overlays/eks
kubectl get ingress -A        # wait until nothing is left
cd infra/terraform/envs/dev && terraform destroy
```

The ECR repositories (with their images) and the secret are deleted immediately in dev. The state bucket stays; it's protected with `prevent_destroy`.

## Checks

These run offline, without AWS credentials:

```bash
cd infra/terraform
terraform fmt -recursive -check
tflint --init && tflint --recursive --config "$PWD/.tflint.hcl"
cd envs/dev && terraform init -backend=false && terraform validate && terraform test
```

`terraform test` plans the whole environment against mocked providers and checks the wiring (subnets, cluster name, secret versioning, input validation).

## Known limitations

- **The Helm and Kubernetes providers live in the same configuration as the cluster.** This is convenient for a single dev environment. If a plan fails because the cluster isn't reachable yet (for example after it was replaced), run `terraform apply -target=module.eks` first. Larger setups split the cluster add-ons into a separate configuration or use GitOps.
- **HTTP only.** The app is served on the ALB hostname. HTTPS needs a domain: an ACM certificate, then the `certificate-arn` and `listen-ports` annotations on the Ingress.
- **No node autoscaling.** The HPAs can scale pods to 5 replicas, but the node group is fixed between `min_size` and `max_size` without Cluster Autoscaler or Karpenter.
- **The API uses the RDS master user.** A dedicated database user with only the needed privileges would be better for production.
