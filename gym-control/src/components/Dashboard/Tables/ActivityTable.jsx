import React from 'react';

const ActivityTable = ({ activities }) => {
  const getStatusColor = (status) => {
    const colors = {
      'Acceso permitido': 'bg-[#00ff88]/10 text-[#00ff88]',
      'Acceso bloqueado': 'bg-red-500/10 text-red-500',
      'Salida registrada': 'bg-blue-500/10 text-blue-500',
      'Pase de visita': 'bg-purple-500/10 text-purple-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1a1a1a]">
            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Miembro</th>
            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Hora</th>
            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Movimiento</th>
            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Suscripción</th>
            <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Estado</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, index) => (
            <tr key={index} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-medium text-xs">
                    {activity.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{activity.name}</p>
                    <p className="text-gray-500 text-xs">#{activity.id}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-300 text-sm">{activity.time}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.movement}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-300 text-sm">{activity.subscription}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityTable;