import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VIPS - 숭실대학교 가치투자학회 | Value Investment Pioneers',
  description: 'VIPS(Value Investment Pioneers)는 숭실대학교 금융학부 소속 가치투자 학회입니다. 자체 펀드 운용, 리서치 리포트 발간, CFA 스터디, Alumni 네트워크를 운영합니다.',
  keywords: ['VIPS', '숭실대학교', '가치투자', '투자동아리', '금융학부', 'Value Investment', '숭실대 동아리', '주식 동아리'],
  openGraph: {
    title: 'VIPS - 숭실대학교 가치투자학회',
    description: '가치투자의 본질을 탐구하고, 시장을 이기는 전략을 연구합니다.',
    url: 'https://ssuvips.com',
    siteName: 'VIPS',
    locale: 'ko_KR',
    type: 'website',
  },
  verification: {
    google: 'OZvEX32WTOAQeaVbXuPoUw-rAHHRcoSNEzAomMvqOOU',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://ssuvips.com' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}