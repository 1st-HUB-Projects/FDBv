import React, { useState, useEffect, useMemo } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource'; // Adjust path as needed
import * as Recharts from 'recharts';
import outputs from '../amplify_outputs.json'; // Generated after deployment

Amplify.configure(outputs);

const client = generateClient<Schema>();

type Order = Schema['Order']['type'];
type OrderItem = Schema['OrderItem']['type'];
type Customer = Schema['Customer']['type'];
type DeliveryAgent = Schema['DeliveryAgent']['type'];

const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');
const statusColors: { [key: string]: string } = { 
  ordered: 'bg-blue-500', 
  'in preparation': 'bg-yellow-500', 
  prepared: 'bg-green-500', 
  delivered: 'bg-gray-500' 
};

const HomeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'orders' | 'customers'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [modal, setModal] = useState<{ type: 'orderDetails', order: Order } | { type: 'assignDelivery' } | null>(null);

  useEffect(() => {
    const sub = client.models.Order.observeQuery({
      selectionSet: ['id', 'customerPhone', 'orderDate', 'status', 'totalAmount', 'itemsNumber', 'lineItems.items.id', 'lineItems.items.itemName', 'lineItems.items.quantity', 'lineItems.items.unitPrice']
    }).subscribe({
      next: ({ items }) => setOrders(items),
    });

    const fetchCustomers = async () => {
      const { data } = await client.models.Customer.list();
      setCustomers(data);
    };
    fetchCustomers();

    const fetchAgents = async () => {
      const { data } = await client.models.DeliveryAgent.list();
      setDeliveryAgents(data);
    };
    fetchAgents();

    return () => sub.unsubscribe();
  }, []);

  const sortedOrders = useMemo(() => {
    const statusOrder = ['ordered', 'in preparation', 'prepared', 'delivered'];
    return [...orders].sort((a, b) => statusOrder.indexOf(a.status ?? '') - statusOrder.indexOf(b.status ?? ''));
  }, [orders]);

  const todaysOrders = useMemo(() => 
    sortedOrders.filter(o => o.orderDate && new Date(o.orderDate).toDateString() === new Date().toDateString()), 
  [sortedOrders]);

  const totalOrdersToday = todaysOrders.length;
  const revenueToday = todaysOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  const inProgress = todaysOrders.filter(o => o.status === 'in preparation').length;
  const readyForDelivery = todaysOrders.filter(o => o.status === 'prepared').length;

  const chartData = [
    { name: 'Ordered', value: todaysOrders.filter(o => o.status === 'ordered').length },
    { name: 'In Progress', value: inProgress },
    { name: 'Ready', value: readyForDelivery },
    { name: 'Delivered', value: todaysOrders.filter(o => o.status === 'delivered').length },
  ];

  const handleAssign = async (agentId: string, selectedOrderIds: string[]) => {
    for (const orderId of selectedOrderIds) {
      await client.models.Order.update({ id: orderId, status: 'delivered' });
    }
    setModal(null);
  };

  const renderDashboard = () => (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white">Good Morning, The Cloud Kitchen</h1>
      <p className="text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <h2 className="text-sm text-slate-400">Total Orders</h2>
          <p className="text-3xl font-bold text-white">{totalOrdersToday}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <h2 className="text-sm text-slate-400">Revenue Today</h2>
          <p className="text-3xl font-bold text-white">${revenueToday.toFixed(2)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-900 p-4 rounded-lg text-center">
          <h2 className="text-sm text-amber-300">In Progress</h2>
          <p className="text-3xl font-bold text-white">{inProgress}</p>
        </div>
        <div className="bg-green-900 p-4 rounded-lg text-center">
          <h2 className="text-sm text-green-300">Ready for Delivery</h2>
          <p className="text-3xl font-bold text-white">{readyForDelivery}</p>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-white mb-2">Today's Order Status</h2>
        <Recharts.ResponsiveContainer width="100%" height={200}>
          <Recharts.BarChart data={chartData}>
            <Recharts.XAxis dataKey="name" stroke="#94a3b8" />
            <Recharts.YAxis stroke="#94a3b8" />
            <Recharts.Bar dataKey="value" fill="#38bdf8" />
          </Recharts.BarChart>
        </Recharts.ResponsiveContainer>
      </div>
      <button onClick={() => setModal({ type: 'assignDelivery' })} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md w-full">Assign Delivery</button>
    </div>
  );

  const renderOrders = () => (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white">Order Management</h1>
      <div className="flex space-x-2">
        <button className="bg-slate-700 text-white py-1 px-3 rounded-md">Active</button>
        <button className="bg-slate-700 text-white py-1 px-3 rounded-md">Prepared</button>
        <button className="bg-sky-600 text-white py-1 px-3 rounded-md">All Orders</button>
      </div>
      <ul className="space-y-2">
        {sortedOrders.map(order => (
          <li key={order.id} className="bg-slate-800 p-3 rounded-md flex justify-between items-center cursor-pointer" onClick={() => setModal({ type: 'orderDetails', order })}>
            <div>
              <p className="font-bold text-white">{order.id}</p>
              <p className="text-sm text-slate-400">{order.customerPhone}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">${(order.totalAmount ?? 0).toFixed(2)}</p>
              <span className={classNames('text-xs text-white px-2 py-1 rounded-full', statusColors[order.status ?? ''])}>{order.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderCustomers = () => (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white">Customers</h1>
      <ul className="space-y-2">
        {customers.map(customer => (
          <li key={customer.phone} className="bg-slate-800 p-3 rounded-md flex justify-between items-center">
            <div>
              <p className="font-bold text-white">{customer.customerName}</p>
              <p className="text-sm text-slate-400">{customer.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Total Orders</p>
              <p className="font-bold text-white">{customer.totalOrders}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderModal = () => {
    if (!modal) return null;

    if (modal.type === 'orderDetails') {
      const { order } = modal;
      const lineItems = order.lineItems?.items ?? [];
      return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-md shadow-xl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{order.id} Details</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-white">Line Items</h3>
                <ul className="space-y-1 mt-1 text-slate-300">
                  {lineItems.map(item => (
                    <li key={item?.id} className="flex justify-between text-sm">
                      <span>{item?.quantity} x {item?.itemName}</span>
                      <span>${(item?.unitPrice ?? 0).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-white">
                <span>Total Amount</span>
                <span>${(order.totalAmount ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === 'assignDelivery') {
      const preparedOrders = todaysOrders.filter(o => o.status === 'prepared');
      const [selectedAgent, setSelectedAgent] = useState(deliveryAgents[0]?.id ?? '');
      const [selectedOrders, setSelectedOrders] = useState<string[]>(preparedOrders.map(o => o.id ?? ''));

      const toggleOrder = (id: string) => setSelectedOrders(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

      return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-md shadow-xl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Assign Delivery</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="agent" className="block text-sm font-medium text-slate-300 mb-1">Select Delivery Agent</label>
                <select id="agent" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600">
                  {deliveryAgents.map(agent => <option key={agent.id} value={agent.id ?? ''}>{agent.name}</option>)}
                </select>
              </div>
              <div>
                <h3 className="font-semibold text-white">Select Orders to Assign</h3>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {preparedOrders.map(order => (
                    <div key={order.id} className="flex items-center bg-slate-700 p-2 rounded-md">
                      <input type="checkbox" id={order.id ?? ''} checked={selectedOrders.includes(order.id ?? '')} onChange={() => toggleOrder(order.id ?? '')} className="h-4 w-4 rounded border-slate-500 text-sky-600" />
                      <label htmlFor={order.id ?? ''} className="ml-3 text-sm text-slate-200">{order.id} ({order.itemsNumber} items)</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-b-lg flex justify-end">
              <button onClick={() => handleAssign(selectedAgent, selectedOrders)} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md" disabled={!selectedAgent || selectedOrders.length === 0}>
                Assign {selectedOrders.length} Orders
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <main className="flex-1 overflow-y-auto">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'orders' && renderOrders()}
        {activeView === 'customers' && renderCustomers()}
      </main>
      {renderModal()}
      <nav className="bg-slate-800 border-t border-slate-700 flex justify-around py-2">
        <button onClick={() => setActiveView('dashboard')} className={classNames('flex flex-col items-center', activeView === 'dashboard' ? 'text-sky-500' : 'text-slate-400')}>
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs">Dashboard</span>
        </button>
        <button onClick={() => setActiveView('orders')} className={classNames('flex flex-col items-center', activeView === 'orders' ? 'text-sky-500' : 'text-slate-400')}>
          <ClipboardListIcon className="w-6 h-6" />
          <span className="text-xs">Orders</span>
        </button>
        <button onClick={() => setActiveView('customers')} className={classNames('flex flex-col items-center', activeView === 'customers' ? 'text-sky-500' : 'text-slate-400')}>
          <UsersIcon className="w-6 h-6" />
          <span className="text-xs">Customers</span>
        </button>
      </nav>
    </div>
  );
};

export default App;