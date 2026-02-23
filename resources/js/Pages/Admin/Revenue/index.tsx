import { useEffect, useState } from 'react';
import { useDashboardStore } from '../Dashboard/useDashboardStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import {
    CurrencyDollarIcon,
    ChartBarIcon,
    ShoppingBagIcon,
    CalendarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

export default function RevenueIndex() {
    const [revenueData, setRevenueData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });

    useEffect(() => {
        loadRevenueData();
    }, [selectedPeriod, dateRange]);

    const loadRevenueData = async () => {
        try {
            setLoading(true);
            const requestData: any = { period: selectedPeriod };
            
            // Add date range if custom dates are selected
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useDashboardStore.revenue(requestData);
            if (response.data?.status) {
                setRevenueData(response.data.data);
            }
        } catch (error) {
            console.error('Error loading revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
        // When custom date is selected, set period to 'custom'
        if (dates.startDate && dates.endDate) {
            setSelectedPeriod('custom');
        } else {
            // Clear period if dates are cleared
            setSelectedPeriod('all');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };
    
    const formatCurrencySimple = (amount: number | string | null | undefined) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
        return `₹${Number(numAmount).toFixed(2)}`;
    };

    const calculateGrowth = (current: number, previous: number) => {
        if (!previous || previous === 0) return null;
        const growth = ((current - previous) / previous) * 100;
        return growth;
    };

    if (loading) {
        return (
            <AdminLayout currentPath="/admin/revenue">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!revenueData) {
        return (
            <AdminLayout currentPath="/admin/revenue">
                <div className="bg-white shadow rounded-lg p-6">
                    <p className="text-center text-gray-500">No revenue data available</p>
                </div>
            </AdminLayout>
        );
    }

    const weekGrowth = calculateGrowth(revenueData.week_revenue || 0, (revenueData.week_revenue || 0) - (revenueData.today_revenue || 0));
    const monthGrowth = calculateGrowth(revenueData.month_revenue || 0, revenueData.week_revenue || 0);
    const yearGrowth = calculateGrowth(revenueData.year_revenue || 0, revenueData.month_revenue || 0);

    const handleClearFilters = () => {
        setSelectedPeriod('all');
        setDateRange({ startDate: null, endDate: null });
    };

    return (
        <AdminLayout currentPath="/admin/revenue">
            <div className="space-y-6">
                <div>
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
                        <p className="mt-2 text-sm text-gray-600">Track and analyze your sales revenue</p>
                    </div>
                    
                    {/* Inline Filters */}
                    <div className="bg-white shadow rounded-lg p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Period
                                </label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) => {
                                            setSelectedPeriod(e.target.value);
                                            // Clear date range when selecting predefined period
                                            if (e.target.value !== 'custom') {
                                                setDateRange({ startDate: null, endDate: null });
                                            }
                                        }}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="year">This Year</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex-shrink-0 min-w-[280px]">
                                <FormDatePicker
                                    title="Date Range"
                                    isRange={true}
                                    useRange={true}
                                    value={dateRange.startDate && dateRange.endDate ? {
                                        startDate: typeof dateRange.startDate === 'string' 
                                            ? new Date(dateRange.startDate) 
                                            : dateRange.startDate,
                                        endDate: typeof dateRange.endDate === 'string' 
                                            ? new Date(dateRange.endDate) 
                                            : dateRange.endDate
                                    } : null}
                                    handleDateChange={handleDateChange}
                                    noMaxDate={false}
                                    noMinLimit={false}
                                    className="text-sm"
                                    popoverDirection="down"
                                />
                            </div>
                            {(selectedPeriod !== 'all' || (dateRange.startDate && dateRange.endDate)) && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium whitespace-nowrap"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Revenue Overview Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Today Revenue */}
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium opacity-90">Today Revenue</p>
                            <CurrencyDollarIcon className="h-5 w-5 opacity-75" />
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatCurrencySimple(revenueData.today_revenue || 0)}
                        </p>
                        <div className="space-y-1 mt-2 pt-2 border-t border-indigo-400/30">
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Cost:</span>
                                <span className="font-medium">{formatCurrencySimple(revenueData.today_cost || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Profit:</span>
                                <span className={`font-semibold ${(revenueData.today_profit || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {formatCurrencySimple(revenueData.today_profit || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Margin:</span>
                                <span className={`font-semibold ${(revenueData.today_profit_margin || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {(revenueData.today_profit_margin || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-indigo-400/30">
                            <ShoppingBagIcon className="h-4 w-4 opacity-75" />
                            <p className="text-xs opacity-75">{revenueData.today_orders || 0} orders</p>
                        </div>
                    </div>

                    {/* Week Revenue */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium opacity-90">This Week</p>
                            <CurrencyDollarIcon className="h-5 w-5 opacity-75" />
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatCurrencySimple(revenueData.week_revenue || 0)}
                        </p>
                        <div className="space-y-1 mt-2 pt-2 border-t border-blue-400/30">
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Cost:</span>
                                <span className="font-medium">{formatCurrencySimple(revenueData.week_cost || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Profit:</span>
                                <span className={`font-semibold ${(revenueData.week_profit || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {formatCurrencySimple(revenueData.week_profit || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Margin:</span>
                                <span className={`font-semibold ${(revenueData.week_profit_margin || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {(revenueData.week_profit_margin || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-400/30">
                            <div className="flex items-center space-x-2">
                                <ShoppingBagIcon className="h-4 w-4 opacity-75" />
                                <p className="text-xs opacity-75">{revenueData.week_orders || 0} orders</p>
                            </div>
                            {weekGrowth !== null && (
                                <div className={`flex items-center text-xs ${weekGrowth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {weekGrowth >= 0 ? (
                                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                    ) : (
                                        <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                                    )}
                                    {Math.abs(weekGrowth).toFixed(1)}%
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Month Revenue */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium opacity-90">This Month</p>
                            <CurrencyDollarIcon className="h-5 w-5 opacity-75" />
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatCurrencySimple(revenueData.month_revenue || 0)}
                        </p>
                        <div className="space-y-1 mt-2 pt-2 border-t border-green-400/30">
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Cost:</span>
                                <span className="font-medium">{formatCurrencySimple(revenueData.month_cost || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Profit:</span>
                                <span className={`font-semibold ${(revenueData.month_profit || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {formatCurrencySimple(revenueData.month_profit || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Margin:</span>
                                <span className={`font-semibold ${(revenueData.month_profit_margin || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {(revenueData.month_profit_margin || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-400/30">
                            <div className="flex items-center space-x-2">
                                <ShoppingBagIcon className="h-4 w-4 opacity-75" />
                                <p className="text-xs opacity-75">{revenueData.month_orders || 0} orders</p>
                            </div>
                            {monthGrowth !== null && (
                                <div className={`flex items-center text-xs ${monthGrowth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {monthGrowth >= 0 ? (
                                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                    ) : (
                                        <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                                    )}
                                    {Math.abs(monthGrowth).toFixed(1)}%
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Year Revenue */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium opacity-90">This Year</p>
                            <CurrencyDollarIcon className="h-5 w-5 opacity-75" />
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatCurrencySimple(revenueData.year_revenue || 0)}
                        </p>
                        <div className="space-y-1 mt-2 pt-2 border-t border-purple-400/30">
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Cost:</span>
                                <span className="font-medium">{formatCurrencySimple(revenueData.year_cost || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Profit:</span>
                                <span className={`font-semibold ${(revenueData.year_profit || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {formatCurrencySimple(revenueData.year_profit || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Margin:</span>
                                <span className={`font-semibold ${(revenueData.year_profit_margin || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {(revenueData.year_profit_margin || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-400/30">
                            <div className="flex items-center space-x-2">
                                <ShoppingBagIcon className="h-4 w-4 opacity-75" />
                                <p className="text-xs opacity-75">{revenueData.year_orders || 0} orders</p>
                            </div>
                            {yearGrowth !== null && (
                                <div className={`flex items-center text-xs ${yearGrowth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {yearGrowth >= 0 ? (
                                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                    ) : (
                                        <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                                    )}
                                    {Math.abs(yearGrowth).toFixed(1)}%
                                </div>
                            )}
                        </div>
                    </div>

                    {/* All Time Revenue */}
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium opacity-90">All Time</p>
                            <CurrencyDollarIcon className="h-5 w-5 opacity-75" />
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {formatCurrencySimple(revenueData.total_revenue || 0)}
                        </p>
                        <div className="space-y-1 mt-2 pt-2 border-t border-gray-500/30">
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Cost:</span>
                                <span className="font-medium">{formatCurrencySimple(revenueData.total_cost || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Profit:</span>
                                <span className={`font-semibold ${(revenueData.total_profit || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {formatCurrencySimple(revenueData.total_profit || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="opacity-75">Margin:</span>
                                <span className={`font-semibold ${(revenueData.total_profit_margin || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {(revenueData.total_profit_margin || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-500/30">
                            <ShoppingBagIcon className="h-4 w-4 opacity-75" />
                            <p className="text-xs opacity-75">{revenueData.total_orders || 0} orders</p>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Revenue Chart */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                                <p className="text-sm text-gray-500 mt-1">Last 12 months</p>
                            </div>
                            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="space-y-3">
                            {revenueData.monthly_revenue && revenueData.monthly_revenue.length > 0 ? (
                                revenueData.monthly_revenue.map((item: any, index: number) => {
                                    const maxRevenue = Math.max(...revenueData.monthly_revenue.map((m: any) => m.revenue || 0));
                                    const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                                    
                                    return (
                                        <div key={index} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-700">{item.month}</span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrencySimple(item.revenue || 0)}
                                                </span>
                                            </div>
                                            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                                    style={{ width: `${percentage}%` }}
                                                >
                                                    {percentage > 15 && (
                                                        <span className="text-xs text-white font-medium">
                                                            {formatCurrencySimple(item.revenue || 0)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">No monthly revenue data available</p>
                            )}
                        </div>
                    </div>

                    {/* Daily Revenue Chart */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Daily Revenue</h3>
                                <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
                            </div>
                            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="overflow-x-auto">
                            <div className="flex space-x-1 min-w-max pb-4">
                                {revenueData.daily_revenue && revenueData.daily_revenue.length > 0 ? (
                                    revenueData.daily_revenue.map((item: any, index: number) => {
                                        const maxRevenue = Math.max(...revenueData.daily_revenue.map((d: any) => d.revenue || 0));
                                        const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                                        
                                        return (
                                            <div key={index} className="flex flex-col items-center min-w-[30px] group relative">
                                                <div className="w-full bg-gray-200 rounded-t" style={{ height: '150px', position: 'relative' }}>
                                                    <div
                                                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t absolute bottom-0 transition-all duration-300 hover:from-indigo-700 hover:to-indigo-600 cursor-pointer"
                                                        style={{ height: `${height}%` }}
                                                    />
                                                </div>
                                                <div className="text-xs text-gray-500 mt-2 text-center">
                                                    {item.day.split(' ')[1]}
                                                </div>
                                                {/* Tooltip on hover */}
                                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 shadow-lg">
                                                    <div className="font-semibold">{item.day}</div>
                                                    <div>{formatCurrencySimple(item.revenue || 0)}</div>
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-8">No daily revenue data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Statistics */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="border-l-4 border-indigo-500 pl-4">
                            <p className="text-sm text-gray-500">Average Order Value</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {revenueData.total_orders > 0
                                    ? formatCurrencySimple((revenueData.total_revenue || 0) / revenueData.total_orders)
                                    : formatCurrencySimple(0)}
                            </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4">
                            <p className="text-sm text-gray-500">Average Daily Revenue (This Month)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {revenueData.month_orders > 0
                                    ? formatCurrencySimple((revenueData.month_revenue || 0) / new Date().getDate())
                                    : formatCurrencySimple(0)}
                            </p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                            <p className="text-sm text-gray-500">Average Weekly Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {revenueData.week_orders > 0
                                    ? formatCurrencySimple((revenueData.week_revenue || 0) / 7)
                                    : formatCurrencySimple(0)}
                            </p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-4">
                            <p className="text-sm text-gray-500">Average Monthly Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {revenueData.monthly_revenue && revenueData.monthly_revenue.length > 0
                                    ? formatCurrencySimple(
                                          revenueData.monthly_revenue.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0) /
                                              revenueData.monthly_revenue.length
                                      )
                                    : formatCurrencySimple(0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

