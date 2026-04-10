/** Common LaTeX commands for editor autocomplete. */
export const LATEX_COMMANDS = [
  // Document structure
  '\\documentclass', '\\usepackage', '\\begin', '\\end',
  '\\input', '\\include', '\\includeonly',

  // Preamble
  '\\title', '\\author', '\\date', '\\maketitle', '\\makeindex',

  // Sectioning
  '\\part', '\\chapter', '\\section', '\\subsection', '\\subsubsection',
  '\\paragraph', '\\subparagraph', '\\appendix', '\\tableofcontents',
  '\\listoffigures', '\\listoftables',

  // Text formatting
  '\\textbf', '\\textit', '\\emph', '\\underline', '\\texttt',
  '\\textsc', '\\textrm', '\\textsf', '\\textup', '\\textsl',
  '\\textnormal', '\\footnote', '\\footnotemark', '\\footnotetext',

  // Font size
  '\\tiny', '\\scriptsize', '\\footnotesize', '\\small', '\\normalsize',
  '\\large', '\\Large', '\\LARGE', '\\huge', '\\Huge',

  // References & citations
  '\\label', '\\ref', '\\pageref', '\\eqref',
  '\\cite', '\\citet', '\\citep', '\\nocite',
  '\\bibliography', '\\bibliographystyle',

  // Math mode
  '\\frac', '\\sqrt', '\\sum', '\\int', '\\oint', '\\prod', '\\lim',
  '\\infty', '\\partial', '\\nabla', '\\cdot', '\\cdots', '\\ldots', '\\vdots', '\\ddots',
  '\\forall', '\\exists', '\\in', '\\notin', '\\subset', '\\supset',
  '\\cup', '\\cap', '\\emptyset', '\\mathbb', '\\mathcal', '\\mathfrak',

  // Greek letters
  '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\varepsilon',
  '\\zeta', '\\eta', '\\theta', '\\vartheta', '\\iota', '\\kappa', '\\lambda',
  '\\mu', '\\nu', '\\xi', '\\pi', '\\varpi', '\\rho', '\\varrho',
  '\\sigma', '\\varsigma', '\\tau', '\\upsilon', '\\phi', '\\varphi',
  '\\chi', '\\psi', '\\omega',
  '\\Gamma', '\\Delta', '\\Theta', '\\Lambda', '\\Xi', '\\Pi',
  '\\Sigma', '\\Upsilon', '\\Phi', '\\Psi', '\\Omega',

  // Math functions
  '\\sin', '\\cos', '\\tan', '\\cot', '\\sec', '\\csc',
  '\\arcsin', '\\arccos', '\\arctan',
  '\\sinh', '\\cosh', '\\tanh',
  '\\log', '\\ln', '\\exp', '\\max', '\\min', '\\sup', '\\inf',
  '\\det', '\\dim', '\\ker', '\\deg', '\\gcd',

  // Relations
  '\\leq', '\\geq', '\\neq', '\\approx', '\\equiv', '\\sim', '\\simeq',
  '\\cong', '\\propto', '\\perp', '\\parallel', '\\ll', '\\gg',

  // Arrows
  '\\leftarrow', '\\rightarrow', '\\leftrightarrow',
  '\\Leftarrow', '\\Rightarrow', '\\Leftrightarrow',
  '\\uparrow', '\\downarrow', '\\updownarrow',
  '\\mapsto', '\\to', '\\gets',

  // Math decorators
  '\\overline', '\\underline', '\\overbrace', '\\underbrace',
  '\\hat', '\\check', '\\tilde', '\\bar', '\\vec', '\\dot', '\\ddot',
  '\\left', '\\right', '\\bigl', '\\bigr', '\\Bigl', '\\Bigr',

  // Math text
  '\\text', '\\mbox', '\\mathbf', '\\mathit', '\\mathrm', '\\mathsf', '\\mathtt',

  // Spacing
  '\\hspace', '\\vspace', '\\hspace*', '\\vspace*',
  '\\hfill', '\\vfill', '\\hskip', '\\vskip',
  '\\noindent', '\\indent', '\\centering', '\\raggedright', '\\raggedleft',
  '\\newline', '\\newpage', '\\clearpage', '\\cleardoublepage',
  '\\pagebreak', '\\linebreak', '\\nolinebreak', '\\nopagebreak',
  '\\quad', '\\qquad', '\\enspace',

  // Lists
  '\\item',

  // Tables
  '\\hline', '\\cline', '\\multicolumn', '\\multirow',
  '\\toprule', '\\midrule', '\\bottomrule', '\\specialrule',

  // Figures & graphics
  '\\includegraphics', '\\caption', '\\subcaption',
  '\\graphicspath', '\\DeclareGraphicsExtensions',

  // Custom commands & lengths
  '\\newcommand', '\\renewcommand', '\\providecommand',
  '\\newenvironment', '\\renewenvironment',
  '\\setlength', '\\addtolength', '\\setcounter', '\\addtocounter',
  '\\newcounter', '\\stepcounter', '\\refstepcounter',
  '\\newlength', '\\newif',

  // Hyperlinks (hyperref)
  '\\href', '\\url', '\\hyperref', '\\hypersetup',
  '\\autoref', '\\nameref',

  // Colors
  '\\color', '\\textcolor', '\\colorbox', '\\fcolorbox',
  '\\definecolor',

  // Misc
  '\\index', '\\glossary', '\\printindex',
  '\\today', '\\LaTeX', '\\TeX', '\\emptypage',
  '\\protect', '\\ensuremath', '\\mbox',
  '\\rule', '\\hrule', '\\vrule',
  '\\pagenumbering', '\\pagestyle', '\\thispagestyle',
  '\\numberwithin', '\\setlength', '\\baselineskip',
];
