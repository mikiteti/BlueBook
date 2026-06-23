export default `
% Required
\\usepackage{graphicx}
\\usepackage{svg}

% Optional
%=========================================================
% Encoding, language, fonts (pdfLaTeX)
%=========================================================
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[english]{babel}
% \\usepackage{lmodern}
\\usepackage{microtype}


\\usepackage{titling}

%=========================================================
% Page layout and spacing
%=========================================================
\\usepackage[a4paper,
            margin=2.5cm,
            headheight=16pt,
            includeheadfoot]{geometry}

\\usepackage{setspace}
\\setstretch{1.05}

\\usepackage{parskip}  % no indent, space between paragraphs

%=========================================================
% Colors — “Warm paper + ink + accents”
% (balanced, not blue-dominant; good for physics solutions)
%=========================================================
\\usepackage{xcolor}

\\definecolor{paper}{HTML}{FFFFFF}
\\definecolor{ink}{HTML}{111827}
\\definecolor{rule}{HTML}{D1D5DB}
\\definecolor{navy}{HTML}{1E3A8A}
\\definecolor{teal}{HTML}{0F766E}
\\definecolor{violet}{HTML}{7C3AED}
\\definecolor{amber}{HTML}{92400E}
\\definecolor{rose}{HTML}{9F1239}
\\definecolor{green}{HTML}{166534}

\\pagecolor{paper}

%---------------------------------------------------------
% Map to your existing names so the rest of the preamble
% keeps working without changes
%---------------------------------------------------------
\\colorlet{mybg}{paper}
\\colorlet{mygray}{ink}
\\colorlet{mylightgray}{rule}
\\colorlet{myblue}{navy} % (kept only as a compatibility alias)

%=========================================================
% Mathematics
%=========================================================
\\usepackage{amsmath,amssymb,amsthm,mathtools}
\\usepackage{bm}
\\usepackage{physics}
\\usepackage{siunitx}
\\sisetup{
  detect-all,
  per-mode=symbol,
  separate-uncertainty = true,
  exponent-product = \\cdot
}
\\usepackage{icomma}
\\usepackage{cancel}

%=========================================================
% Figures, tables, graphics
%=========================================================
\\usepackage{graphicx}

%=========================================================
% TikZ and drawing
%=========================================================
\\usepackage{tikz}
\\usetikzlibrary{
  calc,
  arrows.meta,
  decorations.pathmorphing,
  patterns,
  angles,
  quotes,
  positioning
}

%=========================================================
% Lists
%=========================================================
\\usepackage{enumitem}
\\setlist{
  topsep=2pt,
  itemsep=2pt,
  parsep=0pt
}

%=========================================================
% Header, footer, page style  (Page X of Y + top line)
%=========================================================
\\usepackage{fancyhdr}
\\usepackage{lastpage} % <-- add this

\\pagestyle{fancy}
\\fancyhf{}

\\fancyhead[L]{\\small\\nouppercase{\\leftmark}}
\\fancyhead[R]{\\small\\nouppercase{\\rightmark}}

\\fancyfoot[C]{\\small Page \\thepage\\ of \\pageref{LastPage}}

\\renewcommand{\\headrulewidth}{0.4pt}
\\renewcommand{\\headrule}{\\hbox to\\headwidth{%
  \\color{mylightgray}\\leaders\\hrule height \\headrulewidth\\hfill}}

\\renewcommand{\\footrulewidth}{0.4pt}
\\renewcommand{\\footrule}{\\hbox to\\headwidth{%
  \\color{mylightgray}\\leaders\\hrule height \\footrulewidth\\hfill}}


%=========================================================
% Section title formatting
%=========================================================
\\usepackage{titlesec}

\\titleformat{\\section}
  {\\large\\bfseries\\color{navy}}
  {\\thesection}{0.75em}{}

\\titleformat{\\subsection}
  {\\normalsize\\bfseries\\color{teal}}
  {\\thesubsection}{0.75em}{}

\\titleformat{\\subsubsection}
  {\\normalsize\\bfseries\\color{ink}}
  {\\thesubsubsection}{0.75em}{}

\\titlespacing*{\\section}{0pt}{*3}{*1.5}
\\titlespacing*{\\subsection}{0pt}{*2}{*1}
\\titlespacing*{\\subsubsection}{0pt}{*1.5}{*0.75}

%=========================================================
% Elegant page border
%=========================================================
\\usepackage{eso-pic}

\\AddToShipoutPictureBG{%
  \\begin{tikzpicture}[remember picture,overlay]
    \\draw[mylightgray, line width=0.7pt]
      ($(current page.north west) + (1.2cm,-1.2cm)$)
      rectangle
      ($(current page.south east) + (-1.2cm,1.2cm)$);
  \\end{tikzpicture}
}
`;
