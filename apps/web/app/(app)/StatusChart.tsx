"use client";

import BarChartComponent from "@/components/charts/BarChart/BarChart";

type StatusChartData = { status: string; count: number; fill: string };

// Recharts needs the browser, so the chart is a Client Component fed by server data
const StatusChart = ({ data }: { data: StatusChartData[] }) => {
  return (
    <BarChartComponent
      data={data}
      xAxisKey="status"
      series={[{ dataKey: "count", label: "Applications", colorByIndex: true }]}
      showLegend={false}
      minHeight={260}
      height={260}
      barSize={40}
      yAxisDomain={[0, "auto"]}
    />
  );
};

export default StatusChart;
