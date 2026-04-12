const Footer = () => {
  const student = import.meta.env.VITE_STUDENT_NAME ?? "X";
  const team = import.meta.env.VITE_TEAM_SLUG ?? "Y";

  return (
    <footer className="border-t border-border py-8 bg-muted/50">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Built in AI Web Session 2026, ClearContent CMS, Student: {student}, Team: {team}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
