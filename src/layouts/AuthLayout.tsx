import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-screen bg-[#070a13] text-gray-100 font-sans">
      {/* Left side: Strategic Graphic (Visual representation) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-emerald-950 via-gray-950 to-emerald-900 p-12 lg:flex border-r border-[#1e293b]">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent"></div>
        
        {/* Tactical Pitch Lines Graphic */}
        <div className="absolute bottom-10 left-10 right-10 top-20 border border-emerald-500/20 rounded-2xl overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-1/2 left-1/2 h-48 w-48 border border-emerald-500/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-0 top-1/2 w-full border-t border-emerald-500/20"></div>
          <div className="absolute left-0 top-1/4 bottom-1/4 w-32 border border-emerald-500/20 border-l-0"></div>
          <div className="absolute right-0 top-1/4 bottom-1/4 w-32 border border-emerald-500/20 border-r-0"></div>
        </div>

        {/* Brand Header */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900/50 shadow-xl shadow-emerald-800/40 p-1">
            <img src="/logo.png" alt="CTSN Logo" className="h-full w-full object-contain" />
          </div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
            SCOUT CTSN
          </span>
        </div>

        {/* Footer Text / Quotes */}
        <div className="relative z-10 max-w-lg space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
            Plataforma de Scouting y Análisis Técnico de Elite
          </h2>
          <p className="text-sm leading-relaxed text-gray-400">
            Agilice el seguimiento de talentos, diseñe pizarras tácticas, gestione informes detallados y colabore en tiempo real con su dirección deportiva en un ecosistema robusto y seguro.
          </p>
          <div className="flex gap-2">
            <span className="h-1.5 w-8 rounded-full bg-emerald-500"></span>
            <span className="h-1.5 w-2 rounded-full bg-emerald-800"></span>
            <span className="h-1.5 w-2 rounded-full bg-emerald-800"></span>
          </div>
        </div>
      </div>

      {/* Right side: Login Form Container */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-24">
        <div className="w-full max-w-md space-y-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
