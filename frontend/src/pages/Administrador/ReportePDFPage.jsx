import React from 'react';
import UniversalHeader from '../../components/organisms/Todos/UniversalHeader';
import ReporteComparativo from '../../components/organisms/Administrador/ReporteComparativo';

const ReportePDFPage = () => (
  <div className="flex flex-col min-h-screen">
    <UniversalHeader type="admin" />
    <ReporteComparativo />
  </div>
);

export default ReportePDFPage;
