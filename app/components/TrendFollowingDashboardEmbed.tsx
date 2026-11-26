'use client'

import dynamic from 'next/dynamic'

export const TrendFollowingDashboard = dynamic(() => import('./TrendFollowingDashboard').then(module => module.TrendFollowingDashboard))
