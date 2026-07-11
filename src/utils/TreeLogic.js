// TreeLogic.js
import * as d3 from 'd3';

export function renderFullTree(svgElement, data, onNodeClick) {
    // 1. Bersihkan SVG
    d3.select(svgElement).selectAll("*").remove();

    // 2. Ambil logika kalkulasi pohon Anda (Tree layout/D3 Hierarchy)
    // Gunakan d3.stratify() atau d3.tree() yang biasa Anda gunakan
    const root = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.father || d.mother)(data);

    // ... (Masukkan seluruh logika d3.tree, diagonal link, dll milik Anda di sini) ...

    // 3. PENTING: Saat membuat node, hubungkan event klik dengan callback React
    const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .on("click", (event, d) => {
            onNodeClick(d.data.id); // Ini memicu fungsi di React
        });

    // ... (Sisa ribuan baris kode render Anda di sini) ...
}