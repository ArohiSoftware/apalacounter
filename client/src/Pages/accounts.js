import React, { useState, useEffect } from 'react';
import { FaArrowDown, FaEdit, FaTrash, FaWhatsapp } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {jwtDecode} from 'jwt-decode';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import { deleteOrder, fetchOrders } from '../Redux/Orders/orderSlice';

const Accounts = () => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState('clients');
  const [fullName, setFullName] = useState('');
  const [importedData, setImportedData] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const status = useSelector((state) => state.orders.status);
  const error = useSelector((state) => state.orders.error);
  const orders = useSelector((state) => state.orders.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach(order => {
        console.log("Client fecthed!!");
      });
    }
  }, [orders]);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setFullName(decodedToken.fullName);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    dispatch(logoutclient());
    localStorage.removeItem('token');
    toast.error("Logout Successfully!");
    navigate('/');
  };

  const openWhatsAppPopup = (order) => {
    setSelectedOrder(order);
    setIsPopupOpen(true);
  };

  const handleSendMessage = () => {
    const whatsappUrl = `https://wa.me/${selectedOrder.mobileNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsPopupOpen(false);
  };

  const handleDelete = async (order) => {
    try {
      await dispatch(deleteOrder(order._id)).unwrap();
      dispatch(fetchOrders());
      toast.success('Client deleted successfully!');
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast.error('Failed to delete client: ' + error.message);
    }
  };

  const exportToExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients_Report');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'Clients_Report.xlsx');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      setImportedData(data);
      setShowImportModal(false);
    };
    reader.readAsBinaryString(file);
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    const orderCreatedAt = new Date(order.orderDate);
    const start = new Date(startDate);
    const end = new Date(endDate);

    return (
      Object.values(order).some(value =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      ) &&
      (!startDate || orderDate >= start) &&
      (!endDate || orderDate <= end)
    );
  });

  const renderOrdersTable = (data) => (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 rounded-lg mb-4 border-gray-700 hover:border-gray-900"
      />
      <div className="flex mb-4 space-x-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded-lg"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded-lg"
        />
      </div>
      <table className="w-full mb-6 border-collapse bg-white rounded-lg shadow-md overflow-hidden">
        <thead className="bg-gray-600 text-white">
          <tr>
            <th className="border border-zinc-800 px-4 py-2">SrNo.</th>
            <th className="border border-zinc-800 px-4 py-2">Name</th>
            <th className="border border-zinc-800 px-4 py-2">Mobile Number</th>
            <th className="border border-zinc-800 px-4 py-2">Email</th>
            <th className="border border-zinc-800 px-4 py-2">Status</th>
            <th className="border border-zinc-800 px-4 py-2">Time</th>
            <th className="border border-zinc-800 px-4 py-2">Date</th>
            <th className="border border-zinc-800 px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((order, i) => (
            <tr key={order._id || i} className={(i + 1) % 2 === 0 ? 'bg-zinc-100' : 'bg-white'}>
              <td className="border border-zinc-800 px-4 py-2">{i + 1}</td>
              <td className="border border-zinc-800 px-4 py-2">{order.Name}</td>
              <td className="border border-zinc-800 px-4 py-2">{order.mobileNumber}</td>
              <td className="border border-zinc-800 px-4 py-2">{order.email}</td>
              <td className="border border-zinc-800 px-4 py-2">{order.orderStatus}</td>
              <td className="border border-zinc-800 px-4 py-2">{new Date(order.orderDate).toLocaleTimeString()}</td>
              <td className="border border-zinc-800 px-4 py-2">{new Date(order.orderDate).toLocaleDateString()}</td>
              <td className="border border-zinc-800 px-4 py-2">
                <div className='flex justify-around'>
                  <button className="text-green-500 text-xl">
                    <FaWhatsapp aria-hidden="true" onClick={() => openWhatsAppPopup(order)} />
                  </button>
                  <button className="text-red-500">
                    <FaTrash aria-hidden="true" onClick={() => handleDelete(order)} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white mt-[7rem] rounded-lg mx-6 shadow-lg">
      {isPopupOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg border-[1px] border-gray-600 relative">
      <button
        onClick={() => setIsPopupOpen(false)}
        className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 "
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <h2 className="text-lg font-bold mb-4 flex items-center">
        <FaWhatsapp aria-hidden="true" className='text-green-600 text-4xl mr-2' />
        Send WhatsApp Message
      </h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here"
        className="w-full p-2 border rounded-lg mb-4"
      />
      <div className="flex justify-end">
        <button
          onClick={handleSendMessage}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          Send
        </button>
      </div>
    </div>
  </div>
)}

      <div className="bg-emerald-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm">client Management | Hi, <span className='font-bold'>{fullName}</span></span>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700">
            Logout
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-6">

          <div className="flex space-x-2">
            <button onClick={() => exportToExcel(filteredOrders)} className="bg-white text-black border-black border-[1px] px-4 py-2 rounded hover:text-red-600">
              Export clients
            </button>
            <button onClick={() => setShowImportModal(true)} className="bg-white text-black border-black border-[1px] px-4 py-2 rounded hover:text-red-600">
              Import clients
            </button>
          </div>
        </div>

        {showImportModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-bold mb-4">Import clients</h2>
              <input type="file" onChange={handleFileUpload} className="mb-4" />
              <div className="flex justify-end">
                <button onClick={() => setShowImportModal(false)} className="bg-red-500 text-white px-4 py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
          {status === 'loading' ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error: {error}</div>
        ) : (
          renderOrdersTable(filteredOrders)
        )}
        {selectedView === 'Imported' && renderOrdersTable(importedData)}
      </div>
    </div>
  );
};

export default Accounts;
