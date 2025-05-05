import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!userProfile || userProfile.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // POST: Generate report data for download
    if (req.method === 'POST') {
      const { reportType, format, filters } = req.body;
      
      if (!reportType || !['users', 'transactions', 'kyc', 'payments', 'risk', 'activity'].includes(reportType)) {
        return res.status(400).json({ error: 'Invalid report type' });
      }
      
      if (!format || !['csv', 'pdf', 'json'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format' });
      }
      
      // Generate report data based on type
      let reportData;
      let fileName;
      
      switch (reportType) {
        case 'users':
          reportData = await generateUsersReport(filters);
          fileName = `users_report_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'transactions':
          reportData = await generateTransactionsReport(filters);
          fileName = `transactions_report_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'kyc':
          reportData = await generateKycReport(filters);
          fileName = `kyc_report_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'payments':
          reportData = await generatePaymentsReport(filters);
          fileName = `payments_report_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'risk':
          reportData = await generateRiskReport(filters);
          fileName = `risk_report_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'activity':
          reportData = await generateActivityReport(filters);
          fileName = `activity_report_${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }
      
      // In a real implementation, we would generate the actual file here
      // For this demo, we'll just return the data that would be used to generate the file
      
      // Log the report generation
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          source: 'REPORT_GENERATION',
          message: `${reportType.toUpperCase()} report generated in ${format.toUpperCase()} format`,
          details: JSON.stringify({
            reportType,
            format,
            filters,
            adminId: user.id,
            timestamp: new Date()
          })
        }
      });
      
      return res.status(200).json({ 
        success: true,
        reportType,
        format,
        fileName,
        data: reportData,
        generatedAt: new Date(),
        // In a real implementation, we would include a download URL here
        downloadUrl: `/api/admin/reports/download?file=${fileName}.${format}&token=demo-token`
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper functions to generate report data

async function generateUsersReport(filters: any = {}) {
  const whereClause: any = {};
  
  if (filters.isActive !== undefined) {
    whereClause.isActive = filters.isActive;
  }
  
  if (filters.role) {
    whereClause.role = filters.role;
  }
  
  if (filters.dateFrom) {
    whereClause.createdAt = {
      ...(whereClause.createdAt || {}),
      gte: new Date(filters.dateFrom)
    };
  }
  
  if (filters.dateTo) {
    whereClause.createdAt = {
      ...(whereClause.createdAt || {}),
      lte: new Date(filters.dateTo)
    };
  }
  
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      name: true,
      balance: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLogin: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return users;
}

async function generateTransactionsReport(filters: any = {}) {
  const whereClause: any = {};
  
  if (filters.userId) {
    whereClause.userId = filters.userId;
  }
  
  if (filters.type) {
    whereClause.type = filters.type;
  }
  
  if (filters.dateFrom) {
    whereClause.timestamp = {
      ...(whereClause.timestamp || {}),
      gte: new Date(filters.dateFrom)
    };
  }
  
  if (filters.dateTo) {
    whereClause.timestamp = {
      ...(whereClause.timestamp || {}),
      lte: new Date(filters.dateTo)
    };
  }
  
  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      },
      stock: {
        select: {
          symbol: true,
          name: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  });
  
  return transactions;
}

async function generateKycReport(filters: any = {}) {
  const whereClause: any = {};
  
  if (filters.status) {
    whereClause.status = filters.status;
  }
  
  if (filters.dateFrom) {
    whereClause.createdAt = {
      ...(whereClause.createdAt || {}),
      gte: new Date(filters.dateFrom)
    };
  }
  
  if (filters.dateTo) {
    whereClause.createdAt = {
      ...(whereClause.createdAt || {}),
      lte: new Date(filters.dateTo)
    };
  }
  
  const kycDetails = await prisma.kycDetail.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return kycDetails;
}

async function generatePaymentsReport(filters: any = {}) {
  const whereClause: any = {};
  
  if (filters.status) {
    whereClause.status = filters.status;
  }
  
  if (filters.paymentMethod) {
    whereClause.paymentMethod = filters.paymentMethod;
  }
  
  if (filters.dateFrom) {
    whereClause.createdAt = {
      ...(whereClause.createdAt || {}),
      gte: new Date(filters.dateFrom)
    };
  }
  
  if (filters.dateTo) {
    whereClause.createdAt = {
      ...(whereClause.createdAt || {}),
      lte: new Date(filters.dateTo)
    };
  }
  
  const payments = await prisma.paymentRequest.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return payments;
}

async function generateRiskReport(filters: any = {}) {
  // Get the latest risk report or a specific one if ID is provided
  let riskReport;
  
  if (filters.reportId) {
    riskReport = await prisma.riskReport.findUnique({
      where: { id: filters.reportId }
    });
  } else {
    riskReport = await prisma.riskReport.findFirst({
      orderBy: { createdAt: 'desc' }
    });
  }
  
  if (!riskReport) {
    return null;
  }
  
  // Parse the details JSON
  const details = riskReport.details ? JSON.parse(riskReport.details) : {};
  
  // Get additional data for the report
  const topUsers = await prisma.user.findMany({
    orderBy: { balance: 'desc' },
    take: 10,
    select: {
      id: true,
      email: true,
      name: true,
      balance: true
    }
  });
  
  const topPortfolios = await prisma.portfolio.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      },
      items: {
        include: {
          stock: true
        }
      }
    },
    take: 10
  });
  
  // Calculate portfolio values
  const portfoliosWithValues = topPortfolios.map(portfolio => {
    const value = portfolio.items.reduce((sum, item) => {
      return sum + (item.quantity * item.stock.currentPrice);
    }, 0);
    
    return {
      id: portfolio.id,
      name: portfolio.name,
      user: portfolio.user,
      value
    };
  }).sort((a, b) => b.value - a.value);
  
  return {
    report: riskReport,
    details,
    topUsers,
    topPortfolios: portfoliosWithValues
  };
}

async function generateActivityReport(filters: any = {}) {
  const whereClause: any = {};
  
  if (filters.userId) {
    whereClause.userId = filters.userId;
  }
  
  if (filters.action) {
    whereClause.action = filters.action;
  }
  
  if (filters.dateFrom) {
    whereClause.timestamp = {
      ...(whereClause.timestamp || {}),
      gte: new Date(filters.dateFrom)
    };
  }
  
  if (filters.dateTo) {
    whereClause.timestamp = {
      ...(whereClause.timestamp || {}),
      lte: new Date(filters.dateTo)
    };
  }
  
  const activities = await prisma.userActivity.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: filters.limit || 1000
  });
  
  // Get user details if userId is provided
  let userData = null;
  if (filters.userId) {
    userData = await prisma.user.findUnique({
      where: { id: filters.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLogin: true,
        isActive: true
      }
    });
  }
  
  return {
    activities,
    user: userData
  };
}