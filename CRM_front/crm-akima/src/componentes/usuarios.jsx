import { useState } from 'react';
import { UserHub } from './usuarios/UserHub';
import { UserList } from './usuarios/UserList';
import { UserForm } from './usuarios/UserForm';
import { UserDetails } from './usuarios/UserDetails';
import { RoleManager } from './usuarios/RoleManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const Usuarios = () => {
  const [view, setView] = useState('list'); // 'list', 'form', 'details', 'roles'
  const [selectedUser, setSelectedUser] = useState(null);

  // Handlers
  const handleCreate = () => {
    setSelectedUser(null);
    setView('form');
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setView('form');
  };

  const handleDelete = async (user) => {
    if(!window.confirm(`¿Eliminar usuario ${user.Nombre}?`)) return;
    try {
        const res = await fetch(`${API_URL}/api/users/${user.ID}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if(data.success) {
            alert('Usuario eliminado');
            setView('list'); // Recargar lista
            // Idealmente forzar recarga en UserList
        } else {
            alert(data.message);
        }
    } catch(e) { alert('Error al eliminar'); }
  };

  // Render
  return (
    <div>
        {/* Navegación (Solo si no estamos en detalle profundo) */}
        {view !== 'details' && view !== 'form' && (
            <UserHub activeTab={view} onTabChange={setView} />
        )}

        {view === 'list' && (
            <UserList 
                onViewDetails={(u) => { setSelectedUser(u); setView('details'); }}
                onCreateNew={handleCreate}
            />
        )}

        {view === 'form' && (
            <UserForm 
                initialData={selectedUser}
                onClose={() => setView('list')}
                onSuccess={() => setView('list')}
            />
        )}

        {view === 'details' && selectedUser && (
            <UserDetails 
                user={selectedUser}
                onClose={() => setView('list')}
                onEdit={handleEdit}
                // CAMBIO AQUÍ: En lugar de pasar la lógica de borrar, pasamos qué hacer DESPUÉS de borrar con éxito
                onDeleteSuccess={() => setView('list')} 
            />
        )}

        {view === 'roles' && (
            <RoleManager />
        )}
    </div>
  );
};