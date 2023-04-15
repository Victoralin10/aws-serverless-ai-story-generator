import React, { useState } from 'react';
import { addScene } from '../services/api';
import { toast } from 'react-toastify';

const SceneSuggestionForm: React.FC = () => {
  const [scene, setScene] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await addScene(scene);
      toast.success('Gracias por tu sugerencia!');
    } catch (error) {
      toast.error('Algo salió mal, intenta de nuevo.');
    }
    setScene('');
  };

  const handleSceneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScene(e.target.value);
  };

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-gray-300 sm:text-xl mb-4">
        Sugiere una escena para las historias
      </h2>
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="text"
          id="scene"
          name="scene"
          value={scene}
          onChange={handleSceneChange}
          maxLength={80}
          required
          className="w-full px-4 py-2 bg-white rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-base border-2"
          placeholder="Descripción de la escena"
        />
        <button
          type="submit"
          className="ml-2 px-6 py-2 text-white bg-indigo-600 border-2 border-indigo-600 rounded-r-md hover:bg-indigo-500 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2"
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default SceneSuggestionForm;
