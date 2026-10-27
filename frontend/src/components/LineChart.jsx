const LineChart = ({ data, color = '#3b82f6', height = 140 }) => {
  const W = 300,
    H = height - 10,
    vals = data.map((d) => d.v),
    mn = Math.min(...vals),
    mx = Math.max(...vals),
    rng = mx - mn || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * W, H - ((d.v - mn) / rng) * H]);
  const pl = pts.map((p) => p.join(',')).join(' '),
    area = `0,${H} ${pl} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 2}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g${color.replace('#', '')})`} />
      <polyline points={pl} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={color} />
      ))}
    </svg>
  );
};

export { LineChart };
