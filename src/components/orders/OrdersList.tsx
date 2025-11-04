'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { OrderService, OrderStats } from '@/lib/firestore';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import OrderEditModal from './OrderEditModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import SuccessToast from '@/components/ui/SuccessToast';


interface OrdersListProps {
  refreshTrigger?: number;
}

export default function OrdersList({ refreshTrigger }: OrdersListProps) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    paymentMode: 'all',
    customFromDate: '',
    customToDate: ''
  });

  // Edit and Delete state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Success toast state
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination state for display
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 50;

  // Calculate pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const calculateStatsFromOrders = (orders: Order[]) => {
    const validOrders = orders.filter(order => order.status !== 'cancelled');

    const totalOrders = validOrders.length;
    const totalRevenue = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const upiOrders = validOrders.filter(order => order.paymentMode === 'UPI');
    const upiOrdersCount = upiOrders.length;
    const upiRevenue = upiOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const cashOrders = validOrders.filter(order => order.paymentMode === 'Cash');
    const cashOrdersCount = cashOrders.length;
    const cashRevenue = cashOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return {
      totalOrders,
      totalRevenue,
      upiOrders: upiOrdersCount,
      upiRevenue,
      cashOrders: cashOrdersCount,
      cashRevenue,
    };
  };

  const fetchStats = async (dateRange = filters.dateRange, fromDate = filters.customFromDate, toDate = filters.customToDate) => {
    try {
      setLoadingStats(true);

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (dateRange === 'today') {
        const today = new Date();
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      } else if (dateRange === 'week') {
        const now = new Date();
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
      } else if (dateRange === 'month') {
        const now = new Date();
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
      } else if (dateRange === 'custom' && fromDate && toDate) {
        startDate = new Date(fromDate);
        endDate = new Date(toDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const orderStats = await OrderService.getOrderStatsAggregated(startDate, endDate);
      setStats(orderStats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
        console.warn('⚠️ Firebase quota exceeded. Calculating stats from loaded orders...');
        // Fallback: calculate from already loaded orders
        if (allOrders.length > 0) {
          const fallbackStats = calculateStatsFromOrders(allOrders);
          setStats(fallbackStats);
        }
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchOrders = async (dateRange = filters.dateRange, fromDate = filters.customFromDate, toDate = filters.customToDate, reset = true) => {
    try {
      setLoading(true);
      let fetchedOrders: Order[] = [];

      if (reset) {
        setLastDoc(null);
        setHasMore(true);
      }

      if (dateRange === 'today') {
        fetchedOrders = await OrderService.getTodayOrders();
        setHasMore(false);
      } else if (dateRange === 'custom' && fromDate && toDate) {
        // For custom date range, use paginated fetch with date filter
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const result = await OrderService.getOrdersByDateRangePaginated(startDate, endDate, 200);
        fetchedOrders = result.data;
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } else {
        // For 'all', 'week', 'month' - use paginated fetch
        const result = await OrderService.getOrdersPaginated(200);
        fetchedOrders = result.data;
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);

        if (dateRange === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          fetchedOrders = fetchedOrders.filter(order => {
            if (!order.orderDate || !order.orderDate.toDate) return false;
            return order.orderDate.toDate() >= weekAgo;
          });
        } else if (dateRange === 'month') {
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          fetchedOrders = fetchedOrders.filter(order => {
            if (!order.orderDate || !order.orderDate.toDate) return false;
            return order.orderDate.toDate() >= monthAgo;
          });
        }
      }

      setAllOrders(fetchedOrders);
      applyFilters(fetchedOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
        alert('⚠️ Firebase quota limit exceeded. Please wait for quota to reset (24 hours) or upgrade your Firebase plan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOrders = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;

    try {
      setLoadingMore(true);
      const result = await OrderService.getOrdersPaginated(200, lastDoc);

      let newOrders = result.data;

      // Apply date range filters if needed
      if (filters.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        newOrders = newOrders.filter(order => {
          if (!order.orderDate || !order.orderDate.toDate) return false;
          return order.orderDate.toDate() >= weekAgo;
        });
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        newOrders = newOrders.filter(order => {
          if (!order.orderDate || !order.orderDate.toDate) return false;
          return order.orderDate.toDate() >= monthAgo;
        });
      }

      const updatedOrders = [...allOrders, ...newOrders];
      setAllOrders(updatedOrders);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      applyFilters(updatedOrders);
    } catch (error) {
      console.error('Error loading more orders:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadAllOrders = async () => {
    if (!hasMore || loadingAll) return;

    const confirmed = confirm(
      'This will load ALL remaining orders from the database. This may take a while and consume more Firestore reads. Continue?'
    );

    if (!confirmed) return;

    try {
      setLoadingAll(true);

      // Fetch all orders in batches
      const allFetchedOrders = await OrderService.getAllOrdersInBatches(200);

      // Apply date range filters if needed
      let filteredFetch = allFetchedOrders;
      if (filters.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredFetch = allFetchedOrders.filter(order => {
          if (!order.orderDate || !order.orderDate.toDate) return false;
          return order.orderDate.toDate() >= weekAgo;
        });
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        filteredFetch = allFetchedOrders.filter(order => {
          if (!order.orderDate || !order.orderDate.toDate) return false;
          return order.orderDate.toDate() >= monthAgo;
        });
      }

      setAllOrders(filteredFetch);
      setHasMore(false);
      setLastDoc(null);
      applyFilters(filteredFetch);
    } catch (error) {
      console.error('Error loading all orders:', error);
      alert('Failed to load all orders. Please try again.');
    } finally {
      setLoadingAll(false);
    }
  };

  const applyFilters = (ordersToFilter: Order[]) => {
    let filtered = ordersToFilter;

    // Filter by payment mode
    if (filters.paymentMode !== 'all') {
      filtered = filtered.filter(order => {
        if (filters.paymentMode === 'UPI') {
          return order.paymentMode === 'UPI';
        } else if (filters.paymentMode === 'Cash') {
          return order.paymentMode === 'Cash';
        }
        return true;
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (key === 'dateRange') {
      // Reset custom dates when switching away from custom
      if (value !== 'custom') {
        newFilters.customFromDate = '';
        newFilters.customToDate = '';
        setFilters(newFilters);
      }
      fetchOrders(value, newFilters.customFromDate, newFilters.customToDate);
      fetchStats(value, newFilters.customFromDate, newFilters.customToDate);
    }
    // Payment mode changes are handled by useEffect
  };

  const handleDateRangeChange = (fromDate: string, toDate: string) => {
    const newFilters = {
      ...filters,
      customFromDate: fromDate,
      customToDate: toDate,
      dateRange: 'custom'
    };
    setFilters(newFilters);

    if (fromDate && toDate) {
      fetchOrders('custom', fromDate, toDate);
      fetchStats('custom', fromDate, toDate);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [refreshTrigger]);

  // Auto-update stats when more orders are loaded for non-"all" filters
  useEffect(() => {
    if (allOrders.length > 0 && filters.dateRange !== 'all' && filters.dateRange !== 'custom') {
      const calculatedStats = calculateStatsFromOrders(allOrders);
      setStats(calculatedStats);
    }
  }, [allOrders]);

  // Re-apply filters when payment mode changes
  useEffect(() => {
    if (allOrders.length > 0) {
      applyFilters(allOrders);
    }
  }, [filters.paymentMode]);


  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Pagination component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200">
        <div className="flex flex-1 justify-between sm:hidden">
          {/* Mobile pagination */}
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
              currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
              currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>

        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastOrder, filteredOrders.length)}</span> of{' '}
              <span className="font-medium">{filteredOrders.length}</span> orders
            </p>
          </div>

          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {/* Previous button */}
              <button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-gray-50 focus:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>

              {/* First page if not in visible range */}
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      ...
                    </span>
                  )}
                </>
              )}

              {/* Page numbers */}
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                    page === currentPage
                      ? 'z-10 bg-primary text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Last page if not in visible range */}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next button */}
              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-gray-50 focus:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };


  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';

    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle Edit Order
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  // Handle Save Edited Order
  const handleSaveOrder = async (orderId: string, updatedData: Partial<Order>) => {
    try {
      await OrderService.updateOrder(orderId, updatedData);

      // Refresh orders list
      await fetchOrders(filters.dateRange, filters.customFromDate, filters.customToDate, false);
      await fetchStats(filters.dateRange, filters.customFromDate, filters.customToDate);

      // Show success toast
      setSuccessMessage('Order updated successfully!');
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  // Handle Delete Order - Show modal
  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  // Confirm Delete Order
  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    const orderIdToDelete = orderToDelete;

    // Close modal and reset state IMMEDIATELY
    setShowDeleteModal(false);
    setOrderToDelete(null);

    try {
      setDeletingOrderId(orderIdToDelete);
      await OrderService.deleteOrder(orderIdToDelete);

      // Refresh orders list
      await fetchOrders(filters.dateRange, filters.customFromDate, filters.customToDate, false);
      await fetchStats(filters.dateRange, filters.customFromDate, filters.customToDate);

      // Show success toast
      setSuccessMessage('Order deleted successfully!');
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Cancel Delete Order
  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Filters and Stats */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Loading Filters */}
            <div className="flex flex-row space-x-4">
              <div className="animate-pulse min-w-[200px]">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="animate-pulse min-w-[180px]">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Loading Stats */}
            <div className="flex space-x-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="animate-pulse space-y-2 text-center">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Orders */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Stats Combined */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* Filters Section */}
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date Filter */}
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="custom">📅 Custom Date Range</option>
              </select>
            </div>

            {/* Custom Date Range Inputs - Show only when custom is selected */}
            {filters.dateRange === 'custom' && (
              <>
                <div className="min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.customFromDate}
                    onChange={(e) => {
                      const newFromDate = e.target.value;
                      const newFilters = { ...filters, customFromDate: newFromDate };
                      setFilters(newFilters);
                      // Auto-apply filter if both dates are selected
                      if (newFromDate && filters.customToDate) {
                        handleDateRangeChange(newFromDate, filters.customToDate);
                      }
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                  />
                </div>
                <div className="min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.customToDate}
                    onChange={(e) => {
                      const newToDate = e.target.value;
                      const newFilters = { ...filters, customToDate: newToDate };
                      setFilters(newFilters);
                      // Auto-apply filter if both dates are selected
                      if (filters.customFromDate && newToDate) {
                        handleDateRangeChange(filters.customFromDate, newToDate);
                      }
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => handleDateRangeChange(filters.customFromDate, filters.customToDate)}
                    disabled={!filters.customFromDate || !filters.customToDate}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-10"
                  >
                    Apply Filter
                  </button>
                  <button
                    onClick={() => {
                      setFilters({
                        ...filters,
                        dateRange: 'all',
                        customFromDate: '',
                        customToDate: ''
                      });
                      fetchOrders('all');
                    }}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors h-10"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {/* Payment Mode Filter */}
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Payment</label>
              <select
                value={filters.paymentMode}
                onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
              >
                <option value="all">All Payments</option>
                <option value="UPI">🔵 UPI Only</option>
                <option value="Cash">🟢 Cash Only</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {filters.dateRange === 'custom' && filters.customFromDate && filters.customToDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-blue-800">
                  <span className="mr-2">📅</span>
                  <span>Filtered: {new Date(filters.customFromDate).toLocaleDateString()} to {new Date(filters.customToDate).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => {
                    setFilters({ ...filters, dateRange: 'all', customFromDate: '', customToDate: '' });
                    fetchOrders('all');
                  }}
                  className="text-blue-600 hover:text-blue-800 ml-3"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Stats Section - Desktop: single row, Mobile: 2 rows */}
          <div className="flex flex-col md:flex-row md:flex-wrap gap-3 justify-center lg:justify-end">
            {loadingStats ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100 min-w-[90px]">
                    <div className="animate-pulse space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : stats ? (
              <>
                {/* First Row - Total Orders and Revenue (mobile) */}
                <div className="flex gap-3 justify-center md:contents">
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100 flex-1 md:flex-none md:min-w-[90px]">
                    <div className="text-xl font-bold text-gray-800">{stats.totalOrders}</div>
                    <div className="text-xs text-gray-500">Total Orders</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100 flex-1 md:flex-none md:min-w-[120px]">
                    <div className="text-lg font-bold text-green-700">₹{stats.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Revenue</div>
                  </div>
                </div>

                {/* Second Row - UPI and Cash Orders (mobile) */}
                <div className="flex gap-3 justify-center md:contents">
                  {stats.upiOrders > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100 flex-1 md:flex-none md:min-w-[120px]">
                      <div className="text-lg font-bold text-blue-700">{stats.upiOrders}</div>
                      <div className="text-xs text-blue-600 mb-1">🔵 UPI Orders</div>
                      <div className="text-sm font-semibold text-blue-800">₹{stats.upiRevenue.toLocaleString()}</div>
                    </div>
                  )}
                  {stats.cashOrders > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100 flex-1 md:flex-none md:min-w-[120px]">
                      <div className="text-lg font-bold text-green-700">{stats.cashOrders}</div>
                      <div className="text-xs text-green-600 mb-1">🟢 Cash Orders</div>
                      <div className="text-sm font-semibold text-green-800">₹{stats.cashRevenue.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Desktop View - Hidden on Mobile */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              All Orders ({filteredOrders.length} total, showing {currentOrders.length})
            </h3>
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-gray-500">Payment Methods:</span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                💳 UPI
              </span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                💵 Cash
              </span>
            </div>
          </div>
        </div>

        {currentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 4 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium mb-2">No orders found</p>
            <p className="text-sm">
              {filters.dateRange !== 'all'
                ? "No orders found for the selected date range"
                : "Orders will appear here once customers place them"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentOrders.map((order: Order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-foreground">Order #{order.id?.slice(-6) || 'N/A'}</h4>
                    </div>

                    {/* Show ordered items */}
                    <div className="mb-3">
                      {order.orderItems && order.orderItems.length > 0 ? (
                        <div className="space-y-1">
                          {order.orderItems.map((item: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600">
                              <span className="font-medium text-primary">{item.name}</span>
                              <span className="text-gray-500"> × {item.quantity}</span>
                              <span className="text-gray-500 ml-2">₹{item.total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-primary">Mixed Biryani Items</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-secondary">
                      <div>
                        {(order as any).customerName && (
                          <p><span className="font-medium">Customer:</span> {(order as any).customerName}</p>
                        )}
                        {(order as any).customerPhone && (
                          <p><span className="font-medium">Phone:</span> {(order as any).customerPhone}</p>
                        )}
                        {order.notes && <p><span className="font-medium">Notes:</span> {order.notes}</p>}
                        {order.paymentMode && (
                          <p>
                            <span className="font-medium">Payment:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              order.paymentMode === 'UPI'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {order.paymentMode === 'UPI' ? '💳 UPI' : '💵 Cash'}
                            </span>
                          </p>
                        )}
                      </div>
                      <div>
                        <p><span className="font-medium">Total Items:</span> {order.biryaniQuantity} items</p>
                        <p><span className="font-medium">Total Amount:</span> ₹{order.totalAmount.toLocaleString()}</p>
                        <p><span className="font-medium">Date:</span> {formatDate(order.orderDate)}</p>
                      </div>
                    </div>

                    {/* Edit and Delete Buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id!)}
                        disabled={deletingOrderId === order.id}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {deletingOrderId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <PaginationComponent />

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={loadMoreOrders}
                disabled={loadingMore || loadingAll}
                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Loading more...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Load Next 200</span>
                  </>
                )}
              </button>

              <button
                onClick={loadAllOrders}
                disabled={loadingMore || loadingAll}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loadingAll ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Loading all orders...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Load ALL Orders</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-sm text-gray-600">
              {allOrders.length} orders loaded • Load more to view additional records
            </p>
          </div>
        )}

        {!hasMore && allOrders.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-sm text-gray-600 font-medium">
              ✓ All orders loaded ({allOrders.length} total)
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card View - Hidden on Desktop, each card has own background with gaps */}
      <div className="md:hidden space-y-4">
        {/* Mobile Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-semibold text-gray-800">
              All Orders <span className="text-sm font-normal text-gray-600">({filteredOrders.length} total, showing {currentOrders.length})</span>
            </h3>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-500">Payment Methods:</span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                💳 UPI
              </span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                💵 Cash
              </span>
            </div>
          </div>
        </div>

        {currentOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden p-6">
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 4 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium mb-2">No orders found</p>
              <p className="text-sm">
                {filters.dateRange !== 'all'
                  ? "No orders found for the selected date range"
                  : "Orders will appear here once customers place them"
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {currentOrders.map((order: Order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r from-primary to-orange-600 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-white rounded-full p-1.5">
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                      </div>
                      <h4 className="font-bold text-white text-sm">#{order.id?.slice(-6) || 'N/A'}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">₹{order.totalAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Order Items Section */}
                <div className="p-3">
                  <div className="mb-3 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-700 uppercase">Items Ordered</span>
                    </div>
                    {order.orderItems && order.orderItems.length > 0 ? (
                      <div className="space-y-1.5">
                        {order.orderItems.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-white rounded px-2 py-1.5">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className="text-primary font-bold text-xs">×{item.quantity}</span>
                              <span className="font-medium text-gray-800 truncate">{item.name}</span>
                            </div>
                            <span className="text-primary font-semibold ml-2">₹{item.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 bg-white rounded px-2 py-1.5">
                        <span className="font-medium text-primary">Mixed Biryani Items</span>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  {((order as any).customerName || (order as any).customerPhone) && (
                    <div className="mb-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center mb-1.5">
                        <svg className="w-4 h-4 text-blue-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-xs font-semibold text-blue-700 uppercase">Customer Details</span>
                      </div>
                      {(order as any).customerName && (
                        <p className="text-sm text-gray-700 mb-0.5">
                          <span className="font-semibold">{(order as any).customerName}</span>
                        </p>
                      )}
                      {(order as any).customerPhone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{(order as any).customerPhone}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Order Meta Info */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-orange-50 rounded-lg p-2.5 border border-orange-100">
                      <div className="text-xs text-orange-600 font-medium mb-0.5">Total Items</div>
                      <div className="text-lg font-bold text-orange-700">{order.biryaniQuantity}</div>
                    </div>
                    {order.paymentMode && (
                      <div className={`rounded-lg p-2.5 border ${
                        order.paymentMode === 'UPI'
                          ? 'bg-blue-50 border-blue-100'
                          : 'bg-green-50 border-green-100'
                      }`}>
                        <div className={`text-xs font-medium mb-0.5 ${
                          order.paymentMode === 'UPI' ? 'text-blue-600' : 'text-green-600'
                        }`}>Payment</div>
                        <div className={`text-sm font-bold ${
                          order.paymentMode === 'UPI' ? 'text-blue-700' : 'text-green-700'
                        }`}>
                          {order.paymentMode === 'UPI' ? '💳 UPI' : '💵 Cash'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mb-3 bg-yellow-50 rounded-lg p-2.5 border border-yellow-100">
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-yellow-600 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div>
                          <span className="text-xs font-semibold text-yellow-700 uppercase">Notes</span>
                          <p className="text-sm text-gray-700 mt-0.5">{order.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date Footer */}
                  <div className="flex items-center justify-center pt-2 border-t border-gray-200 mb-3">
                    <svg className="w-4 h-4 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-500 font-medium">{formatDate(order.orderDate)}</span>
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Order
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id!)}
                      disabled={deletingOrderId === order.id}
                      className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {deletingOrderId === order.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-lg shadow-md border border-gray-200 px-4 py-3">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Mobile Load More Buttons */}
        {hasMore && !loading && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-3">
            <div className="flex flex-col gap-3">
              <button
                onClick={loadMoreOrders}
                disabled={loadingMore || loadingAll}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Loading more...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Load Next 200</span>
                  </>
                )}
              </button>

              <button
                onClick={loadAllOrders}
                disabled={loadingMore || loadingAll}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loadingAll ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Loading all orders...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Load ALL Orders</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-sm text-gray-600">
              {allOrders.length} orders loaded • Load more to view additional records
            </p>
          </div>
        )}

        {/* Mobile All Orders Loaded Message */}
        {!hasMore && allOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 text-center">
            <p className="text-sm text-gray-600 font-medium">
              ✓ All orders loaded ({allOrders.length} total)
            </p>
          </div>
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleSaveOrder}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteOrder}
        onConfirm={confirmDeleteOrder}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete Order"
        cancelText="Cancel"
        isDeleting={deletingOrderId === orderToDelete}
      />

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        message={successMessage}
        onClose={() => setShowSuccessToast(false)}
        duration={3000}
      />
    </div>
  );
}