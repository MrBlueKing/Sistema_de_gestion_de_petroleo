import React from "react";

/**
 * Formulario para registro de personal interno
 * @param {Object} props - Propiedades del componente
 */
export const InternoForm = ({
  form,
  data,
  status,
  handleSelectChange,
  InfoBox,
  SearchableDropdown,
}) => {
  const solicitante = form.solicitante || {};

  return (
    <div className="space-y-4">
      <InfoBox title="Información importante">
        <p>
          Se mostrarán únicamente los trabajadores que{" "}
          <strong>no tienen acceso</strong> al sistema de petróleo. Para revocar
          el acceso a un usuario existente, contacte al administrador del
          sistema.
        </p>
      </InfoBox>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* Selector de solicitante */}
        <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar Trabajador <span className="text-red-500">*</span>
          </label>
          <SearchableDropdown
            options={data.solicitantes}
            value={
              form.solicitante
                ? {
                    label: `${form.solicitante.rut} - ${form.solicitante.nombre}`,
                    value: form.solicitante,
                  }
                : null
            }
            onChange={(selected) =>
              handleSelectChange("solicitante", selected?.value || null)
            }
            disabled={!status.editable || status.loading.fetch}
            placeholder="Buscar por RUT o nombre..."
            isLoading={status.loading.fetch}
            noOptionsMessage="No se encontraron solicitantes disponibles"
          />
        </div>

        {/* Detalles del solicitante seleccionado */}
        {form.solicitante && (
          <div className="sm:col-span-6">
            <div className="mt-1 bg-gray-50 rounded-md border border-gray-200 p-4">
              <dl className="divide-y divide-gray-200">
                <div className="py-2 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">RUT</dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">
                    {solicitante.rut}
                  </dd>
                </div>
                <div className="py-2 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">
                    {solicitante.nombre}
                  </dd>
                </div>
                <div className="py-2 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Cargo</dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">
                    {solicitante.cargo || "No especificado"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Formulario para registro de personal externo
 * @param {Object} props - Propiedades del componente
 */
export const ExternoForm = ({
  form,
  data,
  status,
  handleSelectChange,
  handleInputChange,
  InfoBox,
  SearchableDropdown,
}) => {
  const { personalExterno } = form;

  return (
    <div className="space-y-4">
      <InfoBox title="Información importante">
        <p>
          Registre personal externo asociado a una empresa proveedora. Esto
          incluye conductores y otros trabajadores que necesitan acceso a las
          instalaciones.
        </p>
      </InfoBox>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* Selector de empresa */}
        <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empresa <span className="text-red-500">*</span>
          </label>
          <SearchableDropdown
            options={data.empresas}
            value={
              personalExterno.id_empresa
                ? data.empresas.find(
                    (e) => e.value.id === personalExterno.id_empresa
                  ) || null
                : null
            }
            onChange={(selected) =>
              handleSelectChange("empresa", selected?.value || null)
            }
            disabled={!status.editable || status.loading.fetch}
            placeholder="Buscar empresa por RUT o nombre..."
            isLoading={status.loading.fetch}
            noOptionsMessage="No se encontraron empresas disponibles"
          />

          {!data.empresas.length && !status.loading.fetch && (
            <p className="mt-2 text-xs text-gray-500">
              No hay empresas disponibles. Registre una nueva empresa primero.
            </p>
          )}
        </div>

        {/* Datos de la persona */}
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={personalExterno.nombre}
            onChange={(e) =>
              handleInputChange("personalExterno", "nombre", e.target.value)
            }
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="Nombre completo"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            RUT <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={personalExterno.rut}
            onChange={(e) =>
              handleInputChange("personalExterno", "rut", e.target.value)
            }
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="12.345.678-9"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Formulario para registro de máquina externa
 * @param {Object} props - Propiedades del componente
 */
export const MaquinaExternaForm = ({
  form,
  data,
  status,
  handleSelectChange,
  handleInputChange,
  TIPOS_MAQUINA,
  InfoBox,
  SearchableDropdown,
}) => {
  const { maquinaExterna } = form;

  return (
    <div className="space-y-4">
      <InfoBox title="Información importante">
        <p>
          Registre máquinas externas asociadas a empresas proveedoras. Cada
          máquina debe estar vinculada a una empresa registrada en el sistema.
        </p>
      </InfoBox>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* Selector de empresa */}
        <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empresa <span className="text-red-500">*</span>
          </label>
          <SearchableDropdown
            options={data.empresas}
            value={
              maquinaExterna.id_empresa
                ? data.empresas.find(
                    (e) => e.value.id === maquinaExterna.id_empresa
                  ) || null
                : null
            }
            onChange={(selected) =>
              handleSelectChange("empresa", selected?.value || null)
            }
            disabled={!status.editable || status.loading.fetch}
            placeholder="Buscar empresa por RUT o nombre..."
            isLoading={status.loading.fetch}
            noOptionsMessage="No se encontraron empresas disponibles"
          />

          {!data.empresas.length && !status.loading.fetch && (
            <p className="mt-2 text-xs text-gray-500">
              No hay empresas disponibles. Registre una nueva empresa primero.
            </p>
          )}
        </div>

        {/* Datos de la máquina */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Patente <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={maquinaExterna.patente}
            onChange={(e) =>
              handleInputChange("maquinaExterna", "patente", e.target.value)
            }
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="ABCD12"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Marca <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={maquinaExterna.marca}
            onChange={(e) =>
              handleInputChange("maquinaExterna", "marca", e.target.value)
            }
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="Marca"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Modelo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={maquinaExterna.modelo}
            onChange={(e) =>
              handleInputChange("maquinaExterna", "modelo", e.target.value)
            }
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="Modelo"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            value={maquinaExterna.tipo}
            onChange={(e) => handleSelectChange("tipoMaquina", e.target.value)}
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          >
            <option value="">Seleccione tipo</option>
            {TIPOS_MAQUINA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

/**
 * Formulario para registro de nueva empresa
 * @param {Object} props - Propiedades del componente
 */
export const NuevaEmpresaForm = ({
  form,
  status,
  handleInputChange,
  InfoBox,
}) => {
  const { empresaExterna } = form;

  return (
    <div className="space-y-4">
      <InfoBox title="Información importante">
        <p>
          Registre una nueva empresa proveedora. Una vez registrada, podrá
          asociar personal y maquinaria externa a esta empresa.
        </p>
      </InfoBox>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* Datos de la empresa */}
        <div className="sm:col-span-4">
          <label className="block text-sm font-medium text-gray-700">
            Nombre de la empresa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={empresaExterna.nombre}
            onChange={(e) =>
              handleInputChange("empresaExterna", "nombre", e.target.value)
            }
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="Nombre de la empresa"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            RUT <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={empresaExterna.rut}
            onChange={(e) =>
              handleInputChange("empresaExterna", "rut", e.target.value)
            }
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="76.123.456-7"
          />
        </div>

        <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700">
            Contacto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={empresaExterna.contacto}
            onChange={(e) =>
              handleInputChange("empresaExterna", "contacto", e.target.value)
            }
            disabled={!status.editable}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="Nombre y teléfono/email del contacto"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ingrese el nombre y forma de contacto (teléfono o email) del
            representante de la empresa.
          </p>
        </div>
      </div>
    </div>
  );
};
