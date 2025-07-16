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
    const contentWidth = pageWidth - margin * 2;

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Laporan Analisis Tiket", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 10;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Periode: ${dateRange.startDate} sampai ${dateRange.endDate}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );

    currentY += 5;
    pdf.text(
      `Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
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
      rightColX,
      currentY
    );

    currentY += 5;
    pdf.text(
      `Sedang Diproses: ${
        filteredTickets.filter((t) => t.status === "in_progress").length
      }`,
      leftColX,
      currentY
    );
    pdf.text(
      `Tiket Selesai: ${
        filteredTickets.filter((t) => t.status === "done").length
      }`,
      rightColX,
      currentY
    );

    currentY += 5;
    const completionRate =
      filteredTickets.length > 0
        ? Math.round(
            (filteredTickets.filter((t) => t.status === "done").length /
              filteredTickets.length) *
              100
          )
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
      const maxValue = Math.max(...monthlyChartData.map((d) => d.total));
      if (maxValue > 0) {
        const availableWidth = chartWidth - 20; // Leave margins inside chart
        const barWidth = Math.min(
          (availableWidth / monthlyChartData.length) * 0.6,
          15
        ); // Max 15mm width
        const totalBarsWidth = barWidth * monthlyChartData.length;
        const totalSpacing = availableWidth - totalBarsWidth;
        const spacing = totalSpacing / (monthlyChartData.length + 1);

        monthlyChartData.forEach((data, index) => {
          const barHeight = Math.max(
            (data.total / maxValue) * (chartHeight - 25),
            2
          ); // Min 2mm height
          const barX = chartX + 10 + spacing + index * (barWidth + spacing);
          const barY = currentY + chartHeight - barHeight - 10;

          // FIXED: Ensure bar doesn't go outside chart bounds
          if (barX + barWidth <= chartX + chartWidth - 10) {
            // Draw bar
            pdf.setFillColor(70, 130, 180); // Steel blue color
            pdf.rect(barX, barY, barWidth, barHeight, "F");

            // Add value on top of bar
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.text(data.total.toString(), barX + barWidth / 2, barY - 2, {
              align: "center",
            });

            // Add month label at bottom - FIXED: shorter labels
            let monthLabel = data.month;
            if (monthLabel.length > 8) {
              monthLabel = monthLabel.substring(0, 6) + "..";
            }
            pdf.setFontSize(7);
            pdf.text(
              monthLabel,
              barX + barWidth / 2,
              currentY + chartHeight + 5,
              { align: "center" }
            );
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

      const totalTickets = categoryChartData.reduce(
        (sum, cat) => sum + cat.value,
        0
      );

      categoryChartData.forEach((category, index) => {
        const percentage =
          totalTickets > 0 ? (category.value / totalTickets) * 100 : 0;

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
          [70, 130, 180], // Steel blue
          [144, 238, 144], // Light green
          [255, 182, 193], // Light pink
          [255, 215, 0], // Gold
          [221, 160, 221], // Plum
          [175, 238, 238], // Pale turquoise
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
        month.month.length > 10
          ? month.month.substring(0, 10) + ".."
          : month.month,
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
        category.name.length > 15
          ? category.name.substring(0, 15) + ".."
          : category.name,
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
      message: "Data berhasil diexport ke PDF dengan grafik sederhana",
    };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return { success: false, message: "Gagal export ke PDF: " + error.message };
  }
};

/**
 * Export data to CSV format
 * @param {Object} analyticsData - Data analytics yang telah diproses
 * @param {Object} dateRange - Range tanggal yang dipilih
 * @param {Array} filteredTickets - Data tiket yang sudah difilter
 * @returns {Object} Object with success status and message
 */
export const exportToCSV = async (
  analyticsData,
  dateRange,
  filteredTickets
) => {
  try {
    const { monthlyChartData, categoryChartData, completionByMonthData } =
      analyticsData;

    // Create monthly data CSV content
    let monthlyCSV = "Month,Total,New,In Progress,Done,Completion Rate\n";
    monthlyChartData.forEach((month) => {
      monthlyCSV += `"${month.month}",${month.total},${month.new},${month.in_progress},${month.done},${month.completion_rate}\n`;
    });

    // Create category data CSV content
    let categoryCSV = "Category,Total,Completed,Completion Rate\n";
    categoryChartData.forEach((category) => {
      categoryCSV += `"${category.name}",${category.value},${category.completed},${category.completion_rate}\n`;
    });

    // Combine both datasets with headers
    const csvContent = `TICKET ANALYSIS REPORT
Period: ${dateRange.startDate} to ${dateRange.endDate}
Export Date: ${new Date().toLocaleDateString("id-ID")}

SUMMARY STATISTICS
Total Tickets: ${filteredTickets.length}
New Tickets: ${filteredTickets.filter((t) => t.status === "new").length}
In Progress: ${filteredTickets.filter((t) => t.status === "in_progress").length}
Completed Tickets: ${filteredTickets.filter((t) => t.status === "done").length}
Completion Rate: ${
      filteredTickets.length > 0
        ? Math.round(
            (filteredTickets.filter((t) => t.status === "done").length /
              filteredTickets.length) *
              100
          )
        : 0
    }%

MONTHLY DATA
${monthlyCSV}

CATEGORY DATA
${categoryCSV}`;

    // Create downloadable CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `analisis-tiket-${dateRange.startDate}-to-${dateRange.endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      message: "Data berhasil diexport ke CSV",
    };
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    return { success: false, message: "Gagal export ke CSV: " + error.message };
  }
};

/**
 * Export data to PDF format
 * @param {Object} analyticsData - Data analytics yang telah diproses
 * @param {Object} dateRange - Range tanggal yang dipilih
 * @param {Array} filteredTickets - Data tiket yang sudah difilter
 * @returns {Object} Object with success status and message
 */
export const exportToPDF = async (
  analyticsData,
  dateRange,
  filteredTickets
) => {
  try {
    const { monthlyChartData, categoryChartData } = analyticsData;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let currentY = 20;

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Laporan Analisis Tiket", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 10;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Periode: ${dateRange.startDate} sampai ${dateRange.endDate}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );

    currentY += 8;
    pdf.text(
      `Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );

    currentY += 15;

    // Summary statistics
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Ringkasan Statistik", 15, currentY);

    currentY += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Total Tiket: ${filteredTickets.length}`, 15, currentY);

    currentY += 6;
    pdf.text(
      `Tiket Baru: ${filteredTickets.filter((t) => t.status === "new").length}`,
      15,
      currentY
    );

    currentY += 6;
    pdf.text(
      `Sedang Diproses: ${
        filteredTickets.filter((t) => t.status === "in_progress").length
      }`,
      15,
      currentY
    );

    currentY += 6;
    pdf.text(
      `Tiket Selesai: ${
        filteredTickets.filter((t) => t.status === "done").length
      }`,
      15,
      currentY
    );

    currentY += 6;
    const completionRate =
      filteredTickets.length > 0
        ? Math.round(
            (filteredTickets.filter((t) => t.status === "done").length /
              filteredTickets.length) *
              100
          )
        : 0;
    pdf.text(`Tingkat Penyelesaian: ${completionRate}%`, 15, currentY);

    currentY += 15;

    // Monthly data table
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Data Bulanan", 15, currentY);

    currentY += 8;

    // Table headers
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Bulan", 15, currentY);
    pdf.text("Total", 60, currentY);
    pdf.text("Baru", 80, currentY);
    pdf.text("Proses", 100, currentY);
    pdf.text("Selesai", 125, currentY);
    pdf.text("Rate", 150, currentY);

    currentY += 6;

    // Table data
    pdf.setFont("helvetica", "normal");
    monthlyChartData.forEach((month) => {
      pdf.text(
        month.month.length > 10
          ? month.month.substring(0, 10) + ".."
          : month.month,
        15,
        currentY
      );
      pdf.text(month.total.toString(), 60, currentY);
      pdf.text(month.new.toString(), 80, currentY);
      pdf.text(month.in_progress.toString(), 100, currentY);
      pdf.text(month.done.toString(), 125, currentY);
      pdf.text(month.completion_rate.toString() + "%", 150, currentY);
      currentY += 6;
    });

    currentY += 10;

    // Category data table
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Data Kategori", 15, currentY);

    currentY += 8;

    // Table headers
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Kategori", 15, currentY);
    pdf.text("Total", 80, currentY);
    pdf.text("Selesai", 100, currentY);
    pdf.text("Rate", 125, currentY);

    currentY += 6;

    // Table data
    pdf.setFont("helvetica", "normal");
    categoryChartData.forEach((category) => {
      pdf.text(
        category.name.length > 25
          ? category.name.substring(0, 25) + ".."
          : category.name,
        15,
        currentY
      );
      pdf.text(category.value.toString(), 80, currentY);
      pdf.text(category.completed.toString(), 100, currentY);
      pdf.text(category.completion_rate.toString() + "%", 125, currentY);
      currentY += 6;
    });

    // Save PDF
    const fileName = `analisis-tiket-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
    pdf.save(fileName);

    return {
      success: true,
      message: "Data berhasil diexport ke PDF",
    };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return { success: false, message: "Gagal export ke PDF: " + error.message };
  }
};
