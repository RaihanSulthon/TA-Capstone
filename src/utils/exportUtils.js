/**
 * Export data to PDF format with MANUAL CHARTS (FIXED LAYOUT)
 * @param {Object} analyticsData - Data analytics yang telah diproses
 * @param {Object} dateRange - Range tanggal yang dipilih
 * @param {Array} filteredTickets - Data tiket yang sudah difilter
 */
export const exportToPDFWithManualCharts = async (
  analyticsData,
  dateRange,
  filteredTickets
) => {
  try {
    const { monthlyChartData, categoryChartData } = analyticsData;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

    // FIXED: Define proper margins
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Laporan Analisis Tiket", pageWidth / 2, currentY, { align: "center" });
    
    currentY += 10;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Periode: ${dateRange.startDate} sampai ${dateRange.endDate}`,
      pageWidth / 2, currentY, { align: "center" }
    );

    currentY += 5;
    pdf.text(
      `Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`,
      pageWidth / 2, currentY, { align: "center" }
    );

    currentY += 15;

    // Summary statistics box - FIXED width
    pdf.setDrawColor(0, 0, 0);
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, currentY, contentWidth, 35, "F");
    pdf.rect(margin, currentY, contentWidth, 35, "S");

    currentY += 8;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Ringkasan Statistik", margin + 5, currentY);

    currentY += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    // Two columns layout for statistics - FIXED positioning
    const leftColX = margin + 5;
    const rightColX = pageWidth / 2 + 5;

    pdf.text(`Total Tiket: ${filteredTickets.length}`, leftColX, currentY);
    pdf.text(
      `Tiket Baru: ${filteredTickets.filter((t) => t.status === "new").length}`,
      rightColX, currentY
    );

    currentY += 5;
    pdf.text(
      `Sedang Diproses: ${filteredTickets.filter((t) => t.status === "in_progress").length}`,
      leftColX, currentY
    );
    pdf.text(
      `Tiket Selesai: ${filteredTickets.filter((t) => t.status === "done").length}`,
      rightColX, currentY
    );

    currentY += 5;
    const completionRate = filteredTickets.length > 0
      ? Math.round((filteredTickets.filter((t) => t.status === "done").length / filteredTickets.length) * 100)
      : 0;
    pdf.text(`Tingkat Penyelesaian: ${completionRate}%`, leftColX, currentY);

    currentY += 20;

    // FIXED: Manual Simple Bar Chart for Monthly Data
    if (monthlyChartData && monthlyChartData.length > 0) {
      const chartHeight = 70;
      const chartWidth = contentWidth - 20; // FIXED: proper width calculation
      const chartX = margin + 10;
      const chartY = currentY;

      // Chart title
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Grafik Data Bulanan", chartX, chartY);
      currentY += 10;

      // Draw chart background
      pdf.setFillColor(250, 250, 250);
      pdf.rect(chartX, currentY, chartWidth, chartHeight, "F");
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(chartX, currentY, chartWidth, chartHeight, "S");

      // FIXED: Draw bars with proper spacing
      const maxValue = Math.max(...monthlyChartData.map(d => d.total));
      if (maxValue > 0) {
        const availableWidth = chartWidth - 20; // Leave margins inside chart
        const barWidth = Math.min(availableWidth / monthlyChartData.length * 0.6, 15); // Max 15mm width
        const totalBarsWidth = barWidth * monthlyChartData.length;
        const totalSpacing = availableWidth - totalBarsWidth;
        const spacing = totalSpacing / (monthlyChartData.length + 1);

        monthlyChartData.forEach((data, index) => {
          const barHeight = Math.max((data.total / maxValue) * (chartHeight - 25), 2); // Min 2mm height
          const barX = chartX + 10 + spacing + (index * (barWidth + spacing));
          const barY = currentY + chartHeight - barHeight - 10;

          // FIXED: Ensure bar doesn't go outside chart bounds
          if (barX + barWidth <= chartX + chartWidth - 10) {
            // Draw bar
            pdf.setFillColor(70, 130, 180); // Steel blue color
            pdf.rect(barX, barY, barWidth, barHeight, "F");

            // Add value on top of bar
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.text(data.total.toString(), barX + barWidth/2, barY - 2, { align: "center" });

            // Add month label at bottom - FIXED: shorter labels
            let monthLabel = data.month;
            if (monthLabel.length > 8) {
              monthLabel = monthLabel.substring(0, 6) + "..";
            }
            pdf.setFontSize(7);
            pdf.text(monthLabel, barX + barWidth/2, currentY + chartHeight + 5, { align: "center" });
          }
        });
      }

      currentY += chartHeight + 15;
    }

    // FIXED: Simple Category Distribution Chart (horizontal bars)
    if (categoryChartData && categoryChartData.length > 0) {
      const chartY = currentY;
      
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Distribusi Kategori", margin + 10, chartY);
      currentY += 10;

      const totalTickets = categoryChartData.reduce((sum, cat) => sum + cat.value, 0);
      
      categoryChartData.forEach((category, index) => {
        const percentage = totalTickets > 0 ? (category.value / totalTickets) * 100 : 0;
        
        // ULTRA CONSERVATIVE: Fixed positions and widths
        const labelX = margin + 5;
        const labelWidth = 30; // Fixed 30mm for label
        const barStartX = labelX + labelWidth + 5; // 5mm gap
        const maxBarWidth = 90; // Fixed 90mm for bar area
        const textStartX = barStartX + maxBarWidth + 5; // 5mm gap
        
        const barLength = Math.max((percentage / 100) * maxBarWidth, 1);

        // Category name
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        let categoryName = category.name;
        if (categoryName.length > 10) {
          categoryName = categoryName.substring(0, 10) + "..";
        }
        pdf.text(categoryName, labelX, currentY);

        // Progress bar background
        pdf.setFillColor(240, 240, 240);
        pdf.rect(barStartX, currentY - 4, maxBarWidth, 6, "F");

        // Progress bar fill
        const colors = [
          [70, 130, 180],   // Steel blue
          [144, 238, 144],  // Light green
          [255, 182, 193],  // Light pink
          [255, 215, 0],    // Gold
          [221, 160, 221],  // Plum
          [175, 238, 238]   // Pale turquoise
        ];
        const color = colors[index % colors.length];
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(barStartX, currentY - 4, barLength, 6, "F");

        // Percentage text - GUARANTEED to fit
        pdf.setFontSize(8);
        const percentText = `${category.value} (${percentage.toFixed(0)}%)`;
        pdf.text(percentText, textStartX, currentY);

        currentY += 10;
      });

      currentY += 10;
    }

    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = 20;
    }

    // FIXED: Monthly data table with proper column widths
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Data Bulanan", margin, currentY);
    currentY += 8;

    // FIXED: Table headers with adjusted widths
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    const headers = ["Bulan", "Total", "Baru", "Proses", "Selesai", "Rate(%)"];
    const colWidths = [30, 18, 18, 18, 18, 20]; // FIXED: Reduced column widths
    let currentX = margin;

    headers.forEach((header, index) => {
      pdf.text(header, currentX, currentY);
      currentX += colWidths[index];
    });

    currentY += 5;

    // Table data
    pdf.setFont("helvetica", "normal");
    monthlyChartData.forEach((month) => {
      currentX = margin;
      const rowData = [
        month.month.length > 10 ? month.month.substring(0, 10) + ".." : month.month,
        month.total.toString(),
        month.new.toString(),
        month.in_progress.toString(),
        month.done.toString(),
        month.completion_rate.toString(),
      ];

      rowData.forEach((data, index) => {
        pdf.text(data, currentX, currentY);
        currentX += colWidths[index];
      });

      currentY += 4;

      // Check if we need a new page
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        currentY = 20;
      }
    });

    currentY += 10;

    // FIXED: Category data table
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Data Kategori", margin, currentY);
    currentY += 8;

    // FIXED: Category table headers with much tighter widths
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    const catHeaders = ["Kategori", "Total", "Selesai", "Rate (%)"];
    const catColWidths = [45, 20, 20, 20]; // REDUCED: Even tighter widths
    currentX = margin;

    catHeaders.forEach((header, index) => {
      pdf.text(header, currentX, currentY);
      currentX += catColWidths[index];
    });

    currentY += 5;

    // Category table data
    pdf.setFont("helvetica", "normal");
    categoryChartData.forEach((category) => {
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        currentY = 20;
      }

      currentX = margin;
      const catRowData = [
        category.name.length > 15 ? category.name.substring(0, 15) + ".." : category.name,
        category.value.toString(),
        category.completed.toString(),
        category.completion_rate.toString(),
      ];

      catRowData.forEach((data, index) => {
        pdf.text(data, currentX, currentY);
        currentX += catColWidths[index];
      });

      currentY += 4;
    });

    // Save PDF
    const fileName = `analisis-tiket-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
    pdf.save(fileName);

    return { 
      success: true, 
      message: "Data berhasil diexport ke PDF dengan grafik sederhana" 
    };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return { success: false, message: "Gagal export ke PDF: " + error.message };
  }
};