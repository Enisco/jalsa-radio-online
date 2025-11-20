import jalsaMainLogo from "../assets/Jalsa_salana_logo.png";

export default function HeaderCard() {
  const websiteTitle = "Jalsa Radio";
  const websiteSubitle =
    "...bringing the Jalsa experience to you LIVE, anywhere in the world";

  return (
    <header className="main-header">
      <div className="header-content">
        <img src={jalsaMainLogo} alt="Logo" className="site-logo" />

        <h1 className="site-title">{websiteTitle}</h1>
        <p className="site-subtitle">{websiteSubitle}</p>
      </div>
    </header>
  );
}
