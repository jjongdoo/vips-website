import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <title>VIPS - 숭실대학교 가치투자학회 | Value Investment Pioneers</title>
        <meta name="description" content="VIPS(Value Investment Pioneers)는 숭실대학교 금융학부 소속 가치투자 학회입니다. 자체 펀드 운용, 리서치 리포트 발간, CFA 스터디, Alumni 네트워크를 운영합니다." />
        <meta name="keywords" content="VIPS, 숭실대학교, 가치투자, 투자동아리, 금융학부, Value Investment, 숭실대 동아리, 주식 동아리, 가치투자학회, SSU" />
        
        {/* 구글 소유권 확인 */}
        <meta name="google-site-verification" content="OZvEX32WTOAQeaVbXuPoUw-rAHHRcoSNEzAomMvqOOU" />
        
        {/* 네이버 소유권 확인 (나중에 코드 받으면 넣기) */}
        {/* <meta name="naver-site-verification" content="여기에코드" /> */}
        
        {/* Open Graph - 카카오톡/SNS 공유 미리보기 */}
        <meta property="og:title" content="VIPS - 숭실대학교 가치투자학회" />
        <meta property="og:description" content="가치투자의 본질을 탐구하고, 시장을 이기는 전략을 연구합니다." />
        <meta property="og:url" content="https://ssuvips.com" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
      </head>
      <body>{children}</body>
    </html>
  );
}