import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const EnhancedAnalytics = ({ tickets = [], users = [] }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [selectedChart, setSelectedChart] = useState("monthly");

  // Filter tickets based on date range
  const getFilteredTickets = () => {
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

    // 3. Enhanced Completion Rate by Month (instead of by user)
    const completionByMonthData = monthlyChartData.filter(month => month.total > 0).map(month => ({
      month: month.month,
      total_tickets: month.total,
      completed_tickets: month.done,
      completion_rate: month.completion_rate,
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
            Diselesaikan: {data.completed_tickets} dari {data.total_tickets} tiket
          </p>
          <p className="text-green-600">
            Tingkat Penyelesaian: {data.completion_rate}%
          </p>
          <p className="text-orange-600">
            Pending: {data.pending} tiket
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
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setDateRange({
                startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {selectedChart === 'monthly' && 'Aktivitas Tiket per Bulan'}
            {selectedChart === 'category' && 'Distribusi Kategori Tiket'}
            {selectedChart === 'completion' && 'Tingkat Penyelesaian per Bulan'}
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            {selectedChart === 'monthly' && (
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3B82F6" name="Total Tiket" />
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
        </div>

        {/* Enhanced Info Panel */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            Insights ({dateRange.startDate} - {dateRange.endDate})
          </h3>
          
          {selectedChart === 'monthly' && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Tiket:</span>
                <span className="font-medium">
                  {monthlyChartData.reduce((sum, item) => sum + item.total, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tiket Selesai:</span>
                <span className="font-medium text-green-600">
                  {monthlyChartData.reduce((sum, item) => sum + item.done, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rata-rata per Bulan:</span>
                <span className="font-medium">
                  {Math.round(monthlyChartData.reduce((sum, item) => sum + item.total, 0) / Math.max(monthlyChartData.length, 1))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tingkat Penyelesaian:</span>
                <span className="font-medium text-blue-600">
                  {Math.round((monthlyChartData.reduce((sum, item) => sum + item.done, 0) / Math.max(monthlyChartData.reduce((sum, item) => sum + item.total, 0), 1)) * 100)}%
                </span>
              </div>
            </div>
          )}
          
          {selectedChart === 'category' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">Kategori Terpopuler:</div>
              {categoryChartData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{item.value} tiket</span>
                    <div className="text-xs text-green-600">
                      {item.completion_rate}% selesai ({item.completed} dari {item.value})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedChart === 'completion' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">Performa Bulanan:</div>
              {completionByMonthData.slice(-5).map((month, index) => (
                <div key={month.month} className="flex justify-between items-center">
                  <span className="text-sm">{month.month}</span>
                  <div className="text-right">
                    <div className="font-medium text-green-600">{month.completion_rate}%</div>
                    <div className="text-xs text-gray-500">
                      {month.completed_tickets}/{month.total_tickets} tiket
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {getFilteredTickets().length}
          </div>
          <div className="text-sm text-gray-600">Total Tiket dalam Periode</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {getFilteredTickets().filter(t => t.status === 'done').length}
          </div>
          <div className="text-sm text-gray-600">Tiket Selesai</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {getFilteredTickets().filter(t => t.status !== 'done').length}
          </div>
          <div className="text-sm text-gray-600">Tiket Pending</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;