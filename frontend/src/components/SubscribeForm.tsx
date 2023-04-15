import { subscribe } from '../services/api';
import React, { useState } from 'react';
import { toast } from 'react-toastify';


const SubscribeForm: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await subscribe(email);
      toast.success('Gracias por suscribirte, revisa tu correo!');
    } catch (error) {
      toast.error('Algo salió mal, intenta de nuevo.');
    }
    setEmail('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-gray-300 sm:text-xl mb-4">
        Suscríbete para recibir las historias
      </h2>
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={handleEmailChange}
          required
          className="w-full px-4 py-2 bg-white rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-base border-2"
          placeholder="Correo electrónico"
        />
        <button
          type="submit"
          className="ml-2 px-6 py-2 text-white bg-indigo-600 border-2 border-indigo-600 rounded-r-md hover:bg-indigo-500 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2"
        >
          Suscribirse
        </button>
      </form>
    </div>
  );
};

export default SubscribeForm;
