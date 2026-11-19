# Demo runbook

Bring the AWS environment up to show the app, then take it down again. Commands are for PowerShell on Windows, run from the repository root.

This assumes the one-time setup from the [README](README.md#deploy) is done: the state bucket exists, and `envs/dev` has `backend.hcl`, `terraform.tfvars` and `terraform init`. GitHub Actions builds and deploys the images, so Docker isn't needed.

While it's up, the environment costs about **$0.40/hour**. Tear it down on the same day.

## Bring it up (~40 minutes)

**1. Sign in to AWS**

```powershell
$env:AWS_PROFILE = "job-tracker"
aws login --profile job-tracker        # if the session has expired
aws sts get-caller-identity            # check the account
```

**2. Create the infrastructure (~20 minutes)**

```powershell
terraform -chdir=infra/terraform/envs/dev apply
```

Review the plan (about 89 resources to add) and type `yes`.

**3. Turn on deploys and deploy `main` (~10 minutes)**

1. Get the deploy role:
   ```powershell
   terraform -chdir=infra/terraform/envs/dev output -raw github_actions_role_arn
   ```
2. In GitHub, go to Settings → Secrets and variables → Actions → Variables, and create `AWS_DEPLOY_ROLE_ARN` with that value.
3. Go to Actions → CD → **Run workflow** on `main`. It builds the three images, pushes them to ECR and applies the Kustomize overlay.

**4. Connect kubectl and check the app**

The cluster is new, so refresh its entry in your kubeconfig:

```powershell
aws eks update-kubeconfig --name job-tracker-dev --region eu-central-1
kubectl -n job-tracker get pods                  # all Running 1/1
kubectl -n job-tracker get ingress job-tracker   # ADDRESS is the link
```

The ALB needs 2–3 minutes after the deploy to pass its health checks. Then open `http://<ADDRESS>`. It must be `http://`: the ALB has no HTTPS listener.

**5. Demo data**

The database starts empty. Seed the demo account in a one-off pod, using the migrate image that CD deployed:

```powershell
$IMAGE = kubectl -n job-tracker get deployment api -o jsonpath='{.spec.template.spec.initContainers[0].image}'
@"
apiVersion: v1
kind: Pod
metadata:
  name: seed
  namespace: job-tracker
spec:
  restartPolicy: Never
  securityContext: { runAsNonRoot: true, runAsUser: 1000, seccompProfile: { type: RuntimeDefault } }
  containers:
    - name: seed
      image: $IMAGE
      command: ["npx", "prisma", "db", "seed"]
      envFrom: [{ secretRef: { name: api-secrets } }]
      env: [{ name: HOME, value: /tmp }, { name: CHECKPOINT_DISABLE, value: "1" }]
      securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: [ALL] } }
"@ | kubectl apply -f -
kubectl -n job-tracker wait --for=jsonpath='{.status.phase}'=Succeeded pod/seed --timeout=180s
kubectl -n job-tracker logs seed
kubectl -n job-tracker delete pod seed
```

Log in as `demo@jobtracker.dev` / `demo12345`.

## Tear it down (~20 minutes)

**1. Turn off deploys.** Delete the `AWS_DEPLOY_ROLE_ARN` variable in GitHub. Merges to `main` then skip CD instead of failing against a cluster that's gone.

**2. Remove the app.** The Load Balancer Controller has to delete the ALB while it's still running; a leftover ALB blocks the VPC from being deleted and keeps costing money.

```powershell
kubectl delete -k infra/k8s/overlays/eks
kubectl get ingress -A          # repeat until "No resources found"
```

**3. Destroy the infrastructure**

```powershell
terraform -chdir=infra/terraform/envs/dev destroy
```

Type `yes`. It should end with `Destroy complete!`. The database, its data, the images and the secret are deleted with it.

**4. Check that nothing is left running.** Each command should print an empty list: `[]`, or nothing if your profile's output format is `text`:

```powershell
aws eks list-clusters --region eu-central-1 --query clusters
aws rds describe-db-instances --region eu-central-1 --query 'DBInstances[].DBInstanceIdentifier'
aws ec2 describe-instances --region eu-central-1 --filters Name=instance-state-name,Values=pending,running --query 'Reservations[].Instances[].InstanceId'
aws ec2 describe-nat-gateways --region eu-central-1 --filter Name=state,Values=available --query 'NatGateways[].NatGatewayId'
aws elbv2 describe-load-balancers --region eu-central-1 --query 'LoadBalancers[].LoadBalancerName'
aws ec2 describe-addresses --region eu-central-1 --query 'Addresses[].PublicIp'
```

These stay and cost nothing or next to nothing:

- the state bucket, which is kept for the next deploy;
- the cluster's KMS key, which stays pending deletion for 30 days;
- sometimes the log group `/aws/eks/job-tracker-dev/cluster`, recreated by the cluster's last log lines. You can delete it in CloudWatch.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `terraform apply` or `kubectl` complain about expired credentials | `aws login --profile job-tracker` |
| CD: `Not authorized to perform sts:AssumeRoleWithWebIdentity` | `github_repository` doesn't match the OIDC subject. See [Continuous deployment](README.md#continuous-deployment). |
| `destroy` fails on the VPC or subnets with `DependencyViolation` | An ALB or its security groups are still there. Run step 2 of the teardown, wait, then run `destroy` again. |
| Pods stay in `Init` or `CrashLoopBackOff` | `kubectl -n job-tracker logs <pod> -c migrate`, or without `-c` for the app container. |
| Login form returns to the login page | Make sure the URL is `http://`, and that the deployed `main` includes the `SECURE_COOKIES` patch in the EKS overlay. |
