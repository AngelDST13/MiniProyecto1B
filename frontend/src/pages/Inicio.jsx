// Página de inicio pública (landing). Presenta el sistema y lleva al login o al registro.
import { useRevelar } from '../hooks/useRevelar.js';
import { NavInicio } from '../components/inicio/NavInicio.jsx';
import { HeroInicio } from '../components/inicio/HeroInicio.jsx';
import { FlujoEstados } from '../components/inicio/FlujoEstados.jsx';
import { FuncionesBento } from '../components/inicio/FuncionesBento.jsx';
import { ModulosInicio } from '../components/inicio/ModulosInicio.jsx';
import { CierreInicio } from '../components/inicio/CierreInicio.jsx';

export const Inicio = () => {
  useRevelar();

  return (
    <div className="overflow-x-clip">
      <NavInicio />
      <main>
        <HeroInicio />
        <FlujoEstados />
        <FuncionesBento />
        <ModulosInicio />
        <CierreInicio />
      </main>
    </div>
  );
};
