import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { exportToCSV, exportToPDF, exportToPDFWithManualCharts } from "../../utils/exportUtils";


const EnhancedAnalytics = ({ tickets = [], users = [] }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [selectedChart, setSelectedChart] = useState("monthly");
  const [dateError, setDateError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [exportLoading, setExportLoading] = useState({
    csv: false,
    pdf: false,
  });

  // Validasi date range
  const validateDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return "Tanggal mulai tidak boleh lebih besar dari tanggal selesai";
    }

    // Validasi maksimal range (opsional - bisa diatur sesuai kebutuhan)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      return "Rentang tanggal maksimal 1 tahun";
    }

    return "";
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Check initial size
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle date change dengan validasi
  const handleDateChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    const error = validateDateRange(
      newDateRange.startDate,
      newDateRange.endDate
    );

    setDateError(error);
    setDateRange(newDateRange);
  };

  // Filter tickets based on date range
  const getFilteredTickets = () => {
    // Jika ada error validasi, return empty array
    if (dateError) {
      return [];
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999); // Include full end date

    return tickets.filter((ticket) => {
      if (!ticket.createdAt) return false;
      const ticketDate = ticket.createdAt.toDate
        ? ticket.createdAt.toDate()
        : new Date(ticket.createdAt);
      return ticketDate >= start && ticketDate <= end;
    });
  };

  // Enhanced data processing with date filters
  const processEnhancedChartData = () => {
    const filteredTickets = getFilteredTickets();

    // 1. Monthly Activity with better granularity
    const monthlyData = {};
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    // Jika ada error, return empty data
    if (dateError) {
      return {
        monthlyChartData: [],
        categoryChartData: [],
        completionByMonthData: [],
      };
    }

    // Initialize all months in range with 0
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const monthKey = d.toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });
      monthlyData[monthKey] = {
        month: monthKey,
        total: 0,
        new: 0,
        in_progress: 0,
        done: 0,
        completion_rate: 0,
      };
    }

    // Fill with actual data
    filteredTickets.forEach((ticket) => {
      const date = ticket.createdAt.toDate
        ? ticket.createdAt.toDate()
        : new Date(ticket.createdAt);
      const monthKey = date.toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].total++;
        monthlyData[monthKey][ticket.status || "new"]++;
      }
    });

    // Calculate completion rates
    Object.values(monthlyData).forEach((month) => {
      if (month.total > 0) {
        month.completion_rate = Math.round((month.done / month.total) * 100);
      }
    });

    const monthlyChartData = Object.values(monthlyData);

    // 2. Category Data (filtered)
    const categoryData = filteredTickets.reduce((acc, ticket) => {
      const category = ticket.kategori || "Lainnya";
      if (!acc[category]) {
        acc[category] = { total: 0, done: 0 };
      }
      acc[category].total++;
      if (ticket.status === "done") {
        acc[category].done++;
      }
      return acc;
    }, {});

    const categoryChartData = Object.entries(categoryData).map(
      ([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: data.total,
        completed: data.done,
        completion_rate:
          data.total > 0 ? Math.round((data.done / data.total) * 100) : 0,
      })
    );

    // 3. Enhanced Completion Rate by Month
    const completionByMonthData = monthlyChartData
      .filter((month) => month.total > 0)
      .map((month) => ({
        month: month.month,
        total_tickets: month.total,
        completed_tickets: month.done,
        completion_rate: month.completion_rate,
        new: month.new,
        in_progress: month.in_progress,
        pending: month.new + month.in_progress,
      }));

    return { monthlyChartData, categoryChartData, completionByMonthData };
  };

  const { monthlyChartData, categoryChartData, completionByMonthData } =
    processEnhancedChartData();

  // Handle export functions
  const handleExportCSV = async () => {
    setExportLoading((prev) => ({ ...prev, csv: true }));

    try {
      const analyticsData = {
        monthlyChartData,
        categoryChartData,
        completionByMonthData,
      };
      const result = await exportToCSV(
        analyticsData,
        dateRange,
        getFilteredTickets()
      );

      if (result.success) {
        // You can add toast notification here if available
        console.log(result.message);
      } else {
        console.error(result.message);
        alert("Gagal export ke CSV: " + result.message);
      }
    } catch (error) {
      console.error("Export CSV error:", error);
      alert("Terjadi kesalahan saat export CSV");
    } finally {
      setExportLoading((prev) => ({ ...prev, csv: false }));
    }
  };

  const handleExportPDF = async () => {
    setExportLoading((prev) => ({ ...prev, pdf: true }));
  
    try {
      const analyticsData = {
        monthlyChartData,
        categoryChartData,
        completionByMonthData,
      };
      
      // Gunakan fungsi alternatif
      const result = await exportToPDFWithManualCharts(
        analyticsData,
        dateRange,
        getFilteredTickets()
      );
  
      if (result.success) {
        console.log(result.message);
      } else {
        console.error(result.message);
        alert("Gagal export ke PDF: " + result.message);
      }
    } catch (error) {
      console.error("Export PDF error:", error);
      alert("Terjadi kesalahan saat export PDF");
    } finally {
      setExportLoading((prev) => ({ ...prev, pdf: false }));
    }
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  // Custom tooltip for completion chart
  const CompletionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">Total Tiket: {data.total_tickets}</p>
          <p className="text-blue-500">Baru: {data.new || 0} tiket</p>
          <p className="text-yellow-600">
            Sedang Diproses: {data.in_progress || 0} tiket
          </p>
          <p className="text-green-600">
            Selesai: {data.completed_tickets} tiket
          </p>
          <p className="text-purple-600">
            Tingkat Penyelesaian: {data.completion_rate}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Enhanced Header with Date Range Filters */}
      <div className="flex flex-col space-y-4 mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">
          Analisis Tiket
        </h2>

        {/* Export Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={
              exportLoading.csv ||
              dateError ||
              getFilteredTickets().length === 0
            }
            className="flex items-center px-3 py-2 bg-green-500 hover:text-green-500 hover:border-green-500 text-white hover:border-1 text-sm font-medium rounded-md hover:bg-white transition-all duration-300 hover:scale-105">
            {exportLoading.csv ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32">
                  <defs>
                    <linearGradient
                      id="vscodeIconsFileTypeExcel0"
                      x1="4.494"
                      x2="13.832"
                      y1="-2092.086"
                      y2="-2075.914"
                      gradientTransform="translate(0 2100)"
                      gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#18884f" />
                      <stop offset=".5" stopColor="#117e43" />
                      <stop offset="1" stopColor="#0b6631" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="#185c37"
                    d="M19.581 15.35L8.512 13.4v14.409A1.19 1.19 0 0 0 9.705 29h19.1A1.19 1.19 0 0 0 30 27.809V22.5Z"
                  />
                  <path
                    fill="#21a366"
                    d="M19.581 3H9.705a1.19 1.19 0 0 0-1.193 1.191V9.5L19.581 16l5.861 1.95L30 16V9.5Z"
                  />
                  <path fill="#107c41" d="M8.512 9.5h11.069V16H8.512Z" />
                  <path
                    d="M16.434 8.2H8.512v16.25h7.922a1.2 1.2 0 0 0 1.194-1.191V9.391A1.2 1.2 0 0 0 16.434 8.2"
                    opacity="0.1"
                  />
                  <path
                    d="M15.783 8.85H8.512V25.1h7.271a1.2 1.2 0 0 0 1.194-1.191V10.041a1.2 1.2 0 0 0-1.194-1.191"
                    opacity="0.2"
                  />
                  <path
                    d="M15.783 8.85H8.512V23.8h7.271a1.2 1.2 0 0 0 1.194-1.191V10.041a1.2 1.2 0 0 0-1.194-1.191"
                    opacity="0.2"
                  />
                  <path
                    d="M15.132 8.85h-6.62V23.8h6.62a1.2 1.2 0 0 0 1.194-1.191V10.041a1.2 1.2 0 0 0-1.194-1.191"
                    opacity="0.2"
                  />
                  <path
                    fill="url(#vscodeIconsFileTypeExcel0)"
                    d="M3.194 8.85h11.938a1.193 1.193 0 0 1 1.194 1.191v11.918a1.193 1.193 0 0 1-1.194 1.191H3.194A1.19 1.19 0 0 1 2 21.959V10.041A1.19 1.19 0 0 1 3.194 8.85"
                  />
                  <path
                    fill="#fff"
                    d="m5.7 19.873l2.511-3.884l-2.3-3.862h1.847L9.013 14.6c.116.234.2.408.238.524h.017q.123-.281.26-.546l1.342-2.447h1.7l-2.359 3.84l2.419 3.905h-1.809l-1.45-2.711A2.4 2.4 0 0 1 9.2 16.8h-.024a1.7 1.7 0 0 1-.168.351l-1.493 2.722Z"
                  />
                  <path
                    fill="#33c481"
                    d="M28.806 3h-9.225v6.5H30V4.191A1.19 1.19 0 0 0 28.806 3"
                  />
                  <path fill="#107c41" d="M19.581 16H30v6.5H19.581Z" />
                </svg>
                Export CSV
              </>
            )}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={
              exportLoading.pdf ||
              dateError ||
              getFilteredTickets().length === 0
            }
            className="flex items-center px-3 py-2 bg-red-700 text-white hover:text-red-700 hover:border-red-700 hover:border-1 text-sm font-medium rounded-md hover:bg-white transition-all duration-300 hover:scale-105">
            {exportLoading.pdf ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32">
                  <path
                    fill="#909090"
                    d="m24.1 2.072l5.564 5.8v22.056H8.879V30h20.856V7.945z"
                  />
                  <path
                    fill="#f4f4f4"
                    d="M24.031 2H8.808v27.928h20.856V7.873z"
                  />
                  <path fill="#7a7b7c" d="M8.655 3.5h-6.39v6.827h20.1V3.5z" />
                  <path fill="#dd2025" d="M22.472 10.211H2.395V3.379h20.077z" />
                  <path
                    fill="#464648"
                    d="M9.052 4.534H7.745v4.8h1.028V7.715L9 7.728a2 2 0 0 0 .647-.117a1.4 1.4 0 0 0 .493-.291a1.2 1.2 0 0 0 .335-.454a2.1 2.1 0 0 0 .105-.908a2.2 2.2 0 0 0-.114-.644a1.17 1.17 0 0 0-.687-.65a2 2 0 0 0-.409-.104a2 2 0 0 0-.319-.026m-.189 2.294h-.089v-1.48h.193a.57.57 0 0 1 .459.181a.92.92 0 0 1 .183.558c0 .246 0 .469-.222.626a.94.94 0 0 1-.524.114m3.671-2.306c-.111 0-.219.008-.295.011L12 4.538h-.78v4.8h.918a2.7 2.7 0 0 0 1.028-.175a1.7 1.7 0 0 0 .68-.491a1.9 1.9 0 0 0 .373-.749a3.7 3.7 0 0 0 .114-.949a4.4 4.4 0 0 0-.087-1.127a1.8 1.8 0 0 0-.4-.733a1.6 1.6 0 0 0-.535-.4a2.4 2.4 0 0 0-.549-.178a1.3 1.3 0 0 0-.228-.017m-.182 3.937h-.1V5.392h.013a1.06 1.06 0 0 1 .6.107a1.2 1.2 0 0 1 .324.4a1.3 1.3 0 0 1 .142.526c.009.22 0 .4 0 .549a3 3 0 0 1-.033.513a1.8 1.8 0 0 1-.169.5a1.1 1.1 0 0 1-.363.36a.67.67 0 0 1-.416.106m5.08-3.915H15v4.8h1.028V7.434h1.3v-.892h-1.3V5.43h1.4v-.892"
                  />
                  <path
                    fill="#dd2025"
                    d="M21.781 20.255s3.188-.578 3.188.511s-1.975.646-3.188-.511m-2.357.083a7.5 7.5 0 0 0-1.473.489l.4-.9c.4-.9.815-2.127.815-2.127a14 14 0 0 0 1.658 2.252a13 13 0 0 0-1.4.288Zm-1.262-6.5c0-.949.307-1.208.546-1.208s.508.115.517.939a10.8 10.8 0 0 1-.517 2.434a4.4 4.4 0 0 1-.547-2.162Zm-4.649 10.516c-.978-.585 2.051-2.386 2.6-2.444c-.003.001-1.576 3.056-2.6 2.444M25.9 20.895c-.01-.1-.1-1.207-2.07-1.16a14 14 0 0 0-2.453.173a12.5 12.5 0 0 1-2.012-2.655a11.8 11.8 0 0 0 .623-3.1c-.029-1.2-.316-1.888-1.236-1.878s-1.054.815-.933 2.013a9.3 9.3 0 0 0 .665 2.338s-.425 1.323-.987 2.639s-.946 2.006-.946 2.006a9.6 9.6 0 0 0-2.725 1.4c-.824.767-1.159 1.356-.725 1.945c.374.508 1.683.623 2.853-.91a23 23 0 0 0 1.7-2.492s1.784-.489 2.339-.623s1.226-.24 1.226-.24s1.629 1.639 3.2 1.581s1.495-.939 1.485-1.035"
                  />
                  <path fill="#909090" d="M23.954 2.077V7.95h5.633z" />
                  <path fill="#f4f4f4" d="M24.031 2v5.873h5.633z" />
                  <path
                    fill="#fff"
                    d="M8.975 4.457H7.668v4.8H8.7V7.639l.228.013a2 2 0 0 0 .647-.117a1.4 1.4 0 0 0 .493-.291a1.2 1.2 0 0 0 .332-.454a2.1 2.1 0 0 0 .105-.908a2.2 2.2 0 0 0-.114-.644a1.17 1.17 0 0 0-.687-.65a2 2 0 0 0-.411-.105a2 2 0 0 0-.319-.026m-.189 2.294h-.089v-1.48h.194a.57.57 0 0 1 .459.181a.92.92 0 0 1 .183.558c0 .246 0 .469-.222.626a.94.94 0 0 1-.524.114m3.67-2.306c-.111 0-.219.008-.295.011l-.235.006h-.78v4.8h.918a2.7 2.7 0 0 0 1.028-.175a1.7 1.7 0 0 0 .68-.491a1.9 1.9 0 0 0 .373-.749a3.7 3.7 0 0 0 .114-.949a4.4 4.4 0 0 0-.087-1.127a1.8 1.8 0 0 0-.4-.733a1.6 1.6 0 0 0-.535-.4a2.4 2.4 0 0 0-.549-.178a1.3 1.3 0 0 0-.228-.017m-.182 3.937h-.1V5.315h.013a1.06 1.06 0 0 1 .6.107a1.2 1.2 0 0 1 .324.4a1.3 1.3 0 0 1 .142.526c.009.22 0 .4 0 .549a3 3 0 0 1-.033.513a1.8 1.8 0 0 1-.169.5a1.1 1.1 0 0 1-.363.36a.67.67 0 0 1-.416.106m5.077-3.915h-2.43v4.8h1.028V7.357h1.3v-.892h-1.3V5.353h1.4v-.892"
                  />
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>

        {/* Mobile-first Date Range Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                dateError
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                dateError
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Jenis Chart
            </label>
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="monthly">Tren Aktivitas Bulanan</option>
              <option value="category">Kategori</option>
              <option value="completion">Tingkat Penyelesaian</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setDateRange({
                  startDate: new Date(
                    new Date().setMonth(new Date().getMonth() - 6)
                  )
                    .toISOString()
                    .split("T")[0],
                  endDate: new Date().toISOString().split("T")[0],
                });
                setDateError("");
              }}
              className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
              Reset
            </button>
          </div>
        </div>

        {/* Error Message */}
        {dateError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {dateError}
          </div>
        )}
      </div>

      {/* Error Message untuk Date Validation */}
      {dateError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 text-red-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700">{dateError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div
          id="analytics-charts-container"
          className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {selectedChart === "monthly" && "Aktivitas Tiket per Bulan"}
            {selectedChart === "category" && "Distribusi Kategori Tiket"}
            {selectedChart === "completion" && "Tingkat Penyelesaian per Bulan"}
          </h3>

          {/* Tampilkan placeholder jika ada error */}
          {dateError ? (
            <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96 bg-gray-100 rounded-lg overflow-hidden">
              <div className="text-center text-gray-500 p-4">
                <svg
                  className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm sm:text-base">
                  Silakan perbaiki rentang tanggal untuk melihat analisis
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 sm:h-80 lg:h-96 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart === "monthly" && (
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="new" fill="#60A5FA" name="Baru" />
                    <Bar
                      dataKey="in_progress"
                      fill="#FBBF24"
                      name="Sedang Diproses"
                    />
                    <Bar dataKey="done" fill="#10B981" name="Selesai" />
                  </BarChart>
                )}

                {selectedChart === "category" && (
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, completion_rate }) => {
                        return isMobile
                          ? name
                          : `${name} (${completion_rate}% selesai)`;
                      }}
                      outerRadius={isMobile ? 70 : 100}
                      fill="#8884d8"
                      dataKey="value">
                      {categoryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} tiket (${props.payload.completion_rate}% selesai)`,
                        name,
                      ]}
                    />
                  </PieChart>
                )}

                {selectedChart === "completion" && (
                  <BarChart data={completionByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CompletionTooltip />} />
                    <Bar
                      dataKey="completion_rate"
                      fill="#10B981"
                      name="Tingkat Penyelesaian (%)"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Enhanced Info Panel */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            Insights ({dateRange.startDate} - {dateRange.endDate})
          </h3>

          {dateError ? (
            <div className="text-center text-gray-500">
              <p>Data tidak tersedia karena rentang tanggal tidak valid</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Tiket:</span>
                <span className="font-bold text-blue-600">
                  {getFilteredTickets().length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tiket Baru:</span>
                <span className="font-bold text-blue-500">
                  {
                    getFilteredTickets().filter((t) => t.status === "new")
                      .length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sedang Diproses:</span>
                <span className="font-bold text-yellow-600">
                  {
                    getFilteredTickets().filter(
                      (t) => t.status === "in_progress"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tiket Selesai:</span>
                <span className="font-bold text-green-600">
                  {
                    getFilteredTickets().filter((t) => t.status === "done")
                      .length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rata-rata per Bulan:</span>
                <span className="font-bold text-gray-600">
                  {Math.round(
                    getFilteredTickets().length /
                      Math.max(1, monthlyChartData.length)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tingkat Penyelesaian:</span>
                <span className="font-bold text-purple-600">
                  {getFilteredTickets().length > 0
                    ? Math.round(
                        (getFilteredTickets().filter((t) => t.status === "done")
                          .length /
                          getFilteredTickets().length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          )}

          {selectedChart === "category" && !dateError && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600 mb-2">
                Kategori Populer:
              </div>
              {categoryChartData.slice(0, 5).map((item, index) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center">
                  <span className="text-sm">{item.name}</span>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {item.value} tiket
                    </span>
                    <div className="text-xs text-green-600">
                      {item.completion_rate}% selesai ({item.completed} dari{" "}
                      {item.value})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {getFilteredTickets().length}
          </div>
          <div className="text-sm text-gray-600">Total Tiket dalam Periode</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {getFilteredTickets().filter((t) => t.status === "new").length}
          </div>
          <div className="text-sm text-gray-600">Tiket Baru</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {
              getFilteredTickets().filter((t) => t.status === "in_progress")
                .length
            }
          </div>
          <div className="text-sm text-gray-600">Sedang Diproses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {getFilteredTickets().filter((t) => t.status === "done").length}
          </div>
          <div className="text-sm text-gray-600">Tiket Selesai</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;
