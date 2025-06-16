import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const EnhancedAnalytics = ({ tickets = [], users = [] }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [selectedChart, setSelectedChart] = useState("monthly");
  const [dateError, setDateError] = useState(""); // State untuk error validasi tanggal

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

  // Handle date change dengan validasi
  const handleDateChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    const error = validateDateRange(newDateRange.startDate, newDateRange.endDate);
    
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
    
    return tickets.filter(ticket => {
      if (!ticket.createdAt) return false;
      const ticketDate = ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
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
        completionByMonthData: []
      };
    }
    
    // Initialize all months in range with 0
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const monthKey = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { 
        month: monthKey,
        total: 0,
        new: 0,
        in_progress: 0,
        done: 0,
        completion_rate: 0
      };
    }
    
    // Fill with actual data
    filteredTickets.forEach(ticket => {
      const date = ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      const monthKey = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].total++;
        monthlyData[monthKey][ticket.status || 'new']++;
      }
    });
    
    // Calculate completion rates
    Object.values(monthlyData).forEach(month => {
      if (month.total > 0) {
        month.completion_rate = Math.round((month.done / month.total) * 100);
      }
    });

    const monthlyChartData = Object.values(monthlyData);

    // 2. Category Data (filtered)
    const categoryData = filteredTickets.reduce((acc, ticket) => {
      const category = ticket.kategori || 'Lainnya';
      if (!acc[category]) {
        acc[category] = { total: 0, done: 0 };
      }
      acc[category].total++;
      if (ticket.status === 'done') {
        acc[category].done++;
      }
      return acc;
    }, {});

    const categoryChartData = Object.entries(categoryData).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: data.total,
      completed: data.done,
      completion_rate: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
    }));

    // 3. Enhanced Completion Rate by Month
    const completionByMonthData = monthlyChartData.filter(month => month.total > 0).map(month => ({
      month: month.month,
      total_tickets: month.total,
      completed_tickets: month.done,
      completion_rate: month.completion_rate,
      new: month.new,
      in_progress: month.in_progress,
      pending: month.new + month.in_progress
    }));

    return { monthlyChartData, categoryChartData, completionByMonthData };
  };

  const { monthlyChartData, categoryChartData, completionByMonthData } = processEnhancedChartData();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Custom tooltip for completion chart
  const CompletionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Total Tiket: {data.total_tickets}
          </p>
          <p className="text-blue-500">
            Baru: {data.new || 0} tiket
          </p>
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-xl font-bold text-gray-800">Analisis Tiket</h2>
        
        {/* Date Range Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className={`px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                  dateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
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
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className={`px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                  dateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
            </div>
            <button
              onClick={() => {
                const newDateRange = {
                  startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                };
                setDateRange(newDateRange);
                setDateError("");
              }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>
          
          <select
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="monthly">Tren Aktivitas Bulanan</option>
            <option value="category">Kategori Populer</option>
            <option value="completion">Tingkat Penyelesaian per Bulan</option>
          </select>
        </div>
      </div>

      {/* Error Message untuk Date Validation */}
      {dateError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{dateError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {selectedChart === 'monthly' && 'Aktivitas Tiket per Bulan'}
            {selectedChart === 'category' && 'Distribusi Kategori Tiket'}
            {selectedChart === 'completion' && 'Tingkat Penyelesaian per Bulan'}
          </h3>
          
          {/* Tampilkan placeholder jika ada error */}
          {dateError ? (
            <div className="flex items-center justify-center h-[300px] bg-gray-100 rounded-lg">
              <div className="text-center text-gray-500">
                <svg className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Silakan perbaiki rentang tanggal untuk melihat analisis</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              {selectedChart === 'monthly' && (
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="new" fill="#60A5FA" name="Baru" />
                  <Bar dataKey="in_progress" fill="#FBBF24" name="Sedang Diproses" />
                  <Bar dataKey="done" fill="#10B981" name="Selesai" />
                </BarChart>
              )}
              
              {selectedChart === 'category' && (
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, completion_rate }) => `${name} (${completion_rate}% selesai)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [
                    `${value} tiket (${props.payload.completion_rate}% selesai)`, 
                    name
                  ]} />
                </PieChart>
              )}
              
              {selectedChart === 'completion' && (
                <BarChart data={completionByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CompletionTooltip />} />
                  <Bar dataKey="completion_rate" fill="#10B981" name="Tingkat Penyelesaian (%)" />
                </BarChart>
              )}
            </ResponsiveContainer>
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
                <span className="font-bold text-blue-600">{getFilteredTickets().length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiket Baru:</span>
                <span className="font-bold text-blue-500">{getFilteredTickets().filter(t => t.status === 'new').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Sedang Diproses:</span>
                <span className="font-bold text-yellow-600">{getFilteredTickets().filter(t => t.status === 'in_progress').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiket Selesai:</span>
                <span className="font-bold text-green-600">{getFilteredTickets().filter(t => t.status === 'done').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Rata-rata per Bulan:</span>
                <span className="font-bold text-gray-600">
                  {Math.round(getFilteredTickets().length / Math.max(1, monthlyChartData.length))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tingkat Penyelesaian:</span>
                <span className="font-bold text-purple-600">
                  {getFilteredTickets().length > 0 
                    ? Math.round((getFilteredTickets().filter(t => t.status === 'done').length / getFilteredTickets().length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          )}

          {selectedChart === 'category' && !dateError && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600 mb-2">Kategori Populer:</div>
              {categoryChartData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="text-sm">{item.name}</span>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">{item.value} tiket</span>
                    <div className="text-xs text-green-600">
                      {item.completion_rate}% selesai ({item.completed} dari {item.value})
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
            {getFilteredTickets().filter(t => t.status === 'new').length}
          </div>
          <div className="text-sm text-gray-600">Tiket Baru</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {getFilteredTickets().filter(t => t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600">Sedang Diproses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {getFilteredTickets().filter(t => t.status === 'done').length}
          </div>
          <div className="text-sm text-gray-600">Tiket Selesai</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;
