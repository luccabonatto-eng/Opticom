const Gauge = ({ score }) => {
  const cx = 100,
    cy = 90,
    r = 65;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'EXCELENTE' : score >= 60 ? 'BOM' : score >= 40 ? 'ATENÇÃO' : 'CRÍTICO';
  const t = score / 100,
    rad = (1 - t) * Math.PI;
  const sx = (cx + r * Math.cos(rad)).toFixed(2),
    sy = (cy - r * Math.sin(rad)).toFixed(2);
  const bg = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const sc = score > 0 ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${sx} ${sy}` : '';
  const nx = cx + (r - 14) * Math.cos(rad),
    ny = cy - (r - 14) * Math.sin(rad);
  return (
    <svg width="200" height="110" viewBox="0 0 200 110">
      <path d={bg} fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round" />
      {sc && <path d={sc} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />}
      <line
        x1={cx}
        y1={cy}
        x2={nx.toFixed(1)}
        y2={ny.toFixed(1)}
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="4" fill="#374151" />
      <text x={cx} y={cy - 22} textAnchor="middle" fill={color} fontSize="26" fontWeight="bold" fontFamily="sans-serif">
        {score}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="sans-serif">
        {label}
      </text>
      <text x={cx - r + 2} y={cy + 18} fill="#d1d5db" fontSize="9" fontFamily="sans-serif">
        0
      </text>
      <text x={cx + r - 10} y={cy + 18} fill="#d1d5db" fontSize="9" fontFamily="sans-serif">
        100
      </text>
    </svg>
  );
};

export { Gauge };
