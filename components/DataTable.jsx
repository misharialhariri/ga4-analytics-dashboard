'use client'

export default function DataTable({ columns, rows, emptyMessage = 'No data available', height }) {
  if (!rows?.length) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height: height ?? 160 }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto" style={height ? { maxHeight: height, overflowY: 'auto' } : undefined}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`py-2 pr-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap ${
                  c.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.__key ?? i} className={i % 2 === 1 ? 'bg-gray-50/60' : ''}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`py-1.5 pr-4 tabular-nums text-gray-700 whitespace-nowrap ${
                    c.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
