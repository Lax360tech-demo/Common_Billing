import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, icon: Icon, change, trend = 'up', subtitle, color = 'indigo' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl shadow-xs"
            style={{
              backgroundColor: 'var(--theme-primary-light, #eef2ff)',
              color: 'var(--theme-primary, #4f46e5)'
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h4 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</h4>
      </div>

      {(subtitle || change) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
                trend === 'up'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400 dark:text-slate-500">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
};
