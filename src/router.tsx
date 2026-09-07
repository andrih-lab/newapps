import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { ProjectListPage } from './pages/ProjectListPage';
import { ProjectPage } from './pages/ProjectPage';
import { ImportPage } from './pages/ImportPage';
import { DedupePage } from './pages/DedupePage';
import { BibliometricsPage } from './pages/BibliometricsPage';
import { CriteriaPage } from './pages/CriteriaPage';
import { ScreeningPage } from './pages/ScreeningPage';
import { ExtractionPage } from './pages/ExtractionPage';
import { PrismaPage } from './pages/PrismaPage';
import { ReportPage } from './pages/ReportPage';
import { ExportPage } from './pages/ExportPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { GuidePage } from './pages/GuidePage';
import { TroubleshootingPage } from './pages/TroubleshootingPage';

export function AppRouter() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/proyek" element={<ProjectListPage />} />
          <Route path="/proyek/:projectId" element={<ProjectPage />}>
            <Route index element={<Navigate to="impor" replace />} />
            <Route path="impor" element={<ImportPage />} />
            <Route path="deduplikasi" element={<DedupePage />} />
            <Route path="bibliometrik" element={<BibliometricsPage />} />
            <Route path="kriteria" element={<CriteriaPage />} />
            <Route path="skrining" element={<ScreeningPage />} />
            <Route path="ekstraksi" element={<ExtractionPage />} />
            <Route path="prisma" element={<PrismaPage />} />
            <Route path="laporan" element={<ReportPage />} />
            <Route path="ekspor" element={<ExportPage />} />
          </Route>
          <Route path="/metodologi" element={<MethodologyPage />} />
          <Route path="/panduan" element={<GuidePage />} />
          <Route path="/panduan/troubleshooting" element={<TroubleshootingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
