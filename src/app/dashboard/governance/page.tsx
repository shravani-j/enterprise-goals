"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  History, 
  CheckCircle, 
  BarChart, 
  User, 
  Tag, 
  Inbox,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GovernancePage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "EMPLOYEE";

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"reports" | "audit">("reports");

  // Performance Reports filters & data
  const [reportsQuery, setReportsQuery] = useState("");
  const [reportsDept, setReportsDept] = useState("ALL");
  const [reportsStartDate, setReportsStartDate] = useState("");
  const [reportsEndDate, setReportsEndDate] = useState("");
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Audit Logs filters & data
  const [auditQuery, setAuditQuery] = useState("");
  const [auditAction, setAuditAction] = useState("ALL");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);

  // Fetch reports function
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams({
        page: reportsPage.toString(),
        limit: "8",
        query: reportsQuery,
        ...(reportsDept !== "ALL" && { department: reportsDept }),
        ...(reportsStartDate && { startDate: reportsStartDate }),
        ...(reportsEndDate && { endDate: reportsEndDate })
      });

      const res = await fetch(`/api/governance/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setReportsData(json.data || []);
        setReportsTotal(json.pagination?.total || 0);
        setReportsTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    } finally {
      setReportsLoading(false);
    }
  }, [reportsPage, reportsQuery, reportsDept, reportsStartDate, reportsEndDate]);

  // Fetch audit logs function
  const fetchAuditLogs = useCallback(async () => {
    if (userRole === "EMPLOYEE") return;
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({
        page: auditPage.toString(),
        limit: "8",
        query: auditQuery,
        ...(auditAction !== "ALL" && { actionType: auditAction }),
        ...(auditStartDate && { startDate: auditStartDate }),
        ...(auditEndDate && { endDate: auditEndDate })
      });

      const res = await fetch(`/api/governance/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAuditData(json.data || []);
        setAuditTotal(json.pagination?.total || 0);
        setAuditTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs:", e);
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditQuery, auditAction, auditStartDate, auditEndDate, userRole]);

  // Fetch data on parameters update
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Download CSV helper
  const handleDownloadCSV = () => {
    const params = new URLSearchParams({
      export: "csv",
      query: reportsQuery,
      ...(reportsDept !== "ALL" && { department: reportsDept }),
      ...(reportsStartDate && { startDate: reportsStartDate }),
      ...(reportsEndDate && { endDate: reportsEndDate })
    });
    window.open(`/api/governance/reports?${params.toString()}`, "_blank");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-50 text-red-700 border-red-200";
      case "MEDIUM": return "bg-amber-50 text-amber-700 border-amber-200";
      case "LOW": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SUBMITTED": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "RETURNED_FOR_REWORK": return "bg-rose-50 text-rose-700 border-rose-200";
      case "COMPLETED": return "bg-teal-50 text-teal-700 border-teal-200";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Reports &amp; Governance</h2>
          <p className="text-sm text-zinc-500">Track planned vs actual achievements, export operational CSV summaries, and audit post-lock adjustments.</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-semibold transition-colors duration-200 -mb-[2px] ${
            activeTab === "reports"
              ? "border-[var(--color-dijon)] text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <BarChart className="w-4 h-4" />
          Achievement Reports
        </button>

        {userRole !== "EMPLOYEE" && (
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-semibold transition-colors duration-200 -mb-[2px] ${
              activeTab === "audit"
                ? "border-[var(--color-dijon)] text-zinc-950"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <History className="w-4 h-4" />
            Audit Trail Logs
          </button>
        )}
      </div>

      {/* RENDER ACHIEVEMENT REPORTS TAB */}
      {activeTab === "reports" && (
        <Card className="border border-zinc-200 bg-white/60 backdrop-blur-md shadow-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6">
            <div>
              <CardTitle className="text-lg font-bold">Planned vs Actual Achievement Tracking</CardTitle>
              <CardDescription>Filter goals and export full details in a spreadsheet-compatible format.</CardDescription>
            </div>
            
            <Button
              onClick={handleDownloadCSV}
              disabled={reportsData.length === 0}
              className="flex items-center gap-2 bg-[var(--color-dijon)] hover:bg-[var(--color-flax)] text-zinc-900 border-none transition-all duration-200 font-semibold"
            >
              <Download className="w-4 h-4" />
              Download CSV Report
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters Bar */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 bg-zinc-50/50 border border-zinc-150 rounded-xl">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search title, employee..."
                  value={reportsQuery}
                  onChange={(e) => {
                    setReportsQuery(e.target.value);
                    setReportsPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-dijon)]"
                />
              </div>

              {/* Department Selector */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <select
                  value={reportsDept}
                  onChange={(e) => {
                    setReportsDept(e.target.value);
                    setReportsPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[var(--color-dijon)]"
                >
                  <option value="ALL">All Departments</option>
                  <option value="ENGINEERING">Engineering</option>
                  <option value="SALES">Sales</option>
                  <option value="HR">HR</option>
                  <option value="MARKETING">Marketing</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  value={reportsStartDate}
                  onChange={(e) => {
                    setReportsStartDate(e.target.value);
                    setReportsPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-dijon)] text-zinc-650"
                />
              </div>

              {/* End Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  value={reportsEndDate}
                  onChange={(e) => {
                    setReportsEndDate(e.target.value);
                    setReportsPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-dijon)] text-zinc-650"
                />
              </div>
            </div>

            {/* Achievement Table */}
            <div className="overflow-x-auto border border-zinc-200 bg-white rounded-xl">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Goal Details</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Weightage</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {reportsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                        Loading performance summaries...
                      </td>
                    </tr>
                  ) : reportsData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 text-sm">
                        <Inbox className="w-8 h-8 mx-auto mb-2 text-zinc-350" />
                        No goals matched your filter requirements.
                      </td>
                    </tr>
                  ) : (
                    reportsData.map((goal) => (
                      <tr key={goal.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 font-semibold text-zinc-700 text-xs">
                              {goal.user.name ? goal.user.name[0] : "E"}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-zinc-900">{goal.user.name || "Anonymous Employee"}</div>
                              <div className="text-xs text-zinc-500">{goal.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[280px]">
                            <div className="text-sm font-semibold text-zinc-900 line-clamp-1">{goal.title}</div>
                            <div className="text-xs text-zinc-500 line-clamp-1">{goal.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-700">
                          {goal.weightage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(goal.priority)}`}>
                            {goal.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(goal.status)}`}>
                            {goal.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                              <div 
                                className="bg-[var(--color-mimosa)] h-full transition-all duration-300"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-zinc-700">{goal.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {reportsTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                <span className="text-xs font-semibold text-zinc-500">
                  Showing Page {reportsPage} of {reportsTotalPages} (Total {reportsTotal} items)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setReportsPage(prev => Math.max(prev - 1, 1))}
                    disabled={reportsPage === 1}
                    className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setReportsPage(prev => Math.min(prev + 1, reportsTotalPages))}
                    disabled={reportsPage === reportsTotalPages}
                    className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* RENDER AUDIT TRAIL LOGS TAB */}
      {activeTab === "audit" && userRole !== "EMPLOYEE" && (
        <Card className="border border-zinc-200 bg-white/60 backdrop-blur-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Chronological Security Audit Trail</CardTitle>
            <CardDescription>Review automated edits, overrides, approvals, and returned rework tasks completed after goal lock.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters Bar */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 bg-zinc-50/50 border border-zinc-150 rounded-xl">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search logs, author..."
                  value={auditQuery}
                  onChange={(e) => {
                    setAuditQuery(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-dijon)]"
                />
              </div>

              {/* Action Type Selector */}
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <select
                  value={auditAction}
                  onChange={(e) => {
                    setAuditAction(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[var(--color-dijon)]"
                >
                  <option value="ALL">All Actions</option>
                  <option value="APPROVAL">Approvals</option>
                  <option value="REWORK_REQUEST">Rework Requests</option>
                  <option value="STATUS_CHANGE">Status Changes</option>
                  <option value="EDIT">Edits</option>
                  <option value="ADMIN_OVERRIDE">Admin Overrides</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => {
                    setAuditStartDate(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-dijon)] text-zinc-650"
                />
              </div>

              {/* End Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => {
                    setAuditEndDate(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-dijon)] text-zinc-650"
                />
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto border border-zinc-200 bg-white rounded-xl">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Who Changed</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action Type</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Log Details</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Adjustments (Old ➔ New)</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                        Loading security audit trail...
                      </td>
                    </tr>
                  ) : auditData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 text-sm">
                        <Inbox className="w-8 h-8 mx-auto mb-2 text-zinc-350" />
                        No audit events tracked under these filters.
                      </td>
                    </tr>
                  ) : (
                    auditData.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors text-sm">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 font-semibold text-zinc-700 text-xs">
                              {log.user.name ? log.user.name[0] : "U"}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900">{log.user.name || "System Admin"}</div>
                              <div className="text-xs text-zinc-500">{log.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-700">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            log.role === "ADMIN" 
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}>
                            {log.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            log.actionType === "ADMIN_OVERRIDE" 
                              ? "bg-rose-50 text-rose-700 border-rose-250"
                              : log.actionType === "APPROVAL"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                              : "bg-zinc-50 text-zinc-700 border-zinc-250"
                          }`}>
                            {log.actionType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[240px] text-zinc-900 line-clamp-2">
                            {log.details || log.action}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {log.previousValue || log.newValue ? (
                            <div className="flex items-center gap-1.5 font-medium text-xs">
                              <span className="text-red-600 line-through bg-red-50 px-1.5 py-0.5 rounded border border-red-200 max-w-[100px] truncate">
                                {log.previousValue || "empty"}
                              </span>
                              <span className="text-zinc-400">➔</span>
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 max-w-[100px] truncate">
                                {log.newValue || "empty"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">No field delta</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500 font-semibold">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {auditTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                <span className="text-xs font-semibold text-zinc-500">
                  Showing Page {auditPage} of {auditTotalPages} (Total {auditTotal} items)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                    disabled={auditPage === 1}
                    className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setAuditPage(prev => Math.min(prev + 1, auditTotalPages))}
                    disabled={auditPage === auditTotalPages}
                    className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
