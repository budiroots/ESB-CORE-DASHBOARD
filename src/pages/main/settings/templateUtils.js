const SAMPLE_DATA = {
  "pEdge Offline": {
    eventTitle: "pEdge Offline - JKT-EDGE-04",
    eventType: "pEdge Offline",
    statusEmoji: "🔴",
    statusColor: "#ef4444",
    timestamp: "11 Aug 2026, 09:42 WIB",
    details:
      '<table style="width:100%;border-collapse:collapse;font-size:13px"><tr><td style="padding:4px 8px;color:#64748b">pEdge</td><td style="padding:4px 8px">JKT-EDGE-04 - Jakarta DC</td></tr><tr><td style="padding:4px 8px;color:#64748b">Region</td><td style="padding:4px 8px">Jakarta</td></tr><tr><td style="padding:4px 8px;color:#64748b">IP Address</td><td style="padding:4px 8px">10.100.44.12</td></tr></table>',
  },
};

export function renderTemplate(template, sampleKey = "pEdge Offline") {
  const data = SAMPLE_DATA[sampleKey] || {};
  return Object.keys(data).reduce(
    (acc, key) => acc.split(`{{${key}}}`).join(data[key]),
    template || ""
  );
}
