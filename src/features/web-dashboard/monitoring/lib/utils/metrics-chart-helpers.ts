export const getLatestValue = (arr: (number | null)[]): number => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined) {
      return arr[i] as number;
    }
  }
  return 0;
};

export const formatBytes = (bytes: number | null) => {
  if (bytes === null || isNaN(bytes)) return "0 B/s";
  if (bytes === 0) return "0 B/s";
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Helper function to transform raw metrics data into chart format
export const buildLineChartOption = (
  data: (number | null)[],
  timestamps: string[],
  title: string,
  colorHex: string,
) => {
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(20, 27, 45, 0.95)",
      borderColor: "rgba(0, 209, 255, 0.2)",
      textStyle: { color: "#f8fafc", fontSize: 10, fontFamily: "monospace" },
    },
    grid: { top: 25, bottom: 20, left: 35, right: 10 },
    xAxis: {
      type: "category",
      data: timestamps,
      axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.08)" } },
      axisLabel: { color: "#64748b", fontSize: 9, fontFamily: "monospace" },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.03)" } },
      axisLabel: {
        color: "#64748b",
        fontSize: 9,
        fontFamily: "monospace",
        formatter: "{value}%",
      },
    },
    series: [
      {
        name: title,
        data,
        type: "line",
        smooth: true,
        showSymbol: false,
        connectNulls: false,
        z: 3,
        lineStyle: {
          width: 2,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#ff4d6d" },
              { offset: 0.15, color: "#ff4d6d" },
              { offset: 0.2, color: colorHex },
              { offset: 1, color: colorHex },
            ],
          },
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255, 77, 109, 0.15)" },
              { offset: 0.2, color: `${colorHex}1a` },
              { offset: 1, color: "transparent" },
            ],
          },
        },
        markLine: {
          symbol: "none",
          data: [
            {
              yAxis: 85,
              lineStyle: {
                color: "rgba(255, 77, 109, 0.5)",
                type: "dashed",
                width: 1,
              },
            },
          ],
        },
      },
      {
        name: `${title} (Stale Loop)`,
        data,
        type: "line",
        smooth: true,
        showSymbol: false,
        connectNulls: true,
        z: 2,
        lineStyle: {
          type: "dashed",
          width: 1.5,
          color: "rgba(100, 116, 139, 0.35)",
        },
      },
    ],
  };
};