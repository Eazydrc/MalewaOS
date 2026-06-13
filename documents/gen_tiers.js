"use strict";

const path = require("path");
const fs = require("fs");

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  LevelFormat,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageNumber,
  Footer,
  HeadingLevel,
} = require("docx");

// ── colours ──────────────────────────────────────────────────────────────────
const ORANGE   = "E85D26";
const WHITE    = "FFFFFF";
const GREY_SUB = "71717A";
const ROW_ODD  = "FFFFFF";
const ROW_EVEN = "F5F5F5";
const GREEN    = "22C55E";
const RED      = "EF4444";

// ── column widths (DXA) ───────────────────────────────────────────────────────
const COL_W = [3200, 1456, 1456, 1457, 1457]; // sum = 9026

// ── helpers ───────────────────────────────────────────────────────────────────
const noBorder = {
  style: BorderStyle.NONE,
  size:  0,
  color: "auto",
};

function cellBorders() {
  return {
    top:    noBorder,
    bottom: noBorder,
    left:   noBorder,
    right:  noBorder,
  };
}

function cellMargins() {
  return {
    top:    80,
    bottom: 80,
    left:   120,
    right:  120,
  };
}

/** Header cell */
function headerCell(text, colIdx) {
  return new TableCell({
    width:   { size: COL_W[colIdx], type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: ORANGE, color: "auto" },
    borders: cellBorders(),
    margins: cellMargins(),
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold:  true,
            color: WHITE,
            size:  40, // 20pt = 40 half-points
          }),
        ],
      }),
    ],
  });
}

/** Data cell for feature name (col 0) */
function featureCell(text, fill) {
  return new TableCell({
    width:   { size: COL_W[0], type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill, color: "auto" },
    borders: cellBorders(),
    margins: cellMargins(),
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            size: 36, // 18pt
          }),
        ],
      }),
    ],
  });
}

/** Data cell for check / cross (cols 1-4) */
function checkCell(yes, fill, colIdx) {
  const symbol = yes ? "✓" : "✗";
  const color  = yes ? GREEN    : RED;
  return new TableCell({
    width:   { size: COL_W[colIdx], type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill, color: "auto" },
    borders: cellBorders(),
    margins: cellMargins(),
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text:  symbol,
            bold:  yes,
            color,
            size:  36,
          }),
        ],
      }),
    ],
  });
}

/** Build one data row */
function dataRow(label, checks, rowIndex) {
  // rowIndex 0-based → odd rows (1,3,5…) get grey
  const fill = rowIndex % 2 === 0 ? ROW_ODD : ROW_EVEN;
  return new TableRow({
    children: [
      featureCell(label, fill),
      checkCell(checks[0], fill, 1),
      checkCell(checks[1], fill, 2),
      checkCell(checks[2], fill, 3),
      checkCell(checks[3], fill, 4),
    ],
  });
}

// ── table rows data ────────────────────────────────────────────────────────────
const rows = [
  ["Profil restaurant",                     [true,  true,  true,  true ]],
  ["Menu digital (CRUD)",                   [true,  true,  true,  true ]],
  ["Horaires d’ouverture",             [true,  true,  true,  true ]],
  ["Reservations clients",                  [true,  true,  true,  true ]],
  ["Fiche publique app",                    [true,  true,  true,  true ]],
  ["QR code > menu read-only",              [true,  true,  true,  true ]],
  ["Badges (Populaire/Derniers/Promo)",     [false, true,  true,  true ]],
  ["Offres et promotions",                  [false, true,  true,  true ]],
  ["QR code > menu + offres",               [false, true,  true,  true ]],
  ["Repondre aux avis clients",             [false, true,  true,  true ]],
  ["Commandes en ligne",                    [false, false, true,  true ]],
  ["QR code > commander depuis table",      [false, false, true,  true ]],
  ["Analytics basiques",                    [false, false, true,  true ]],
  ["Gestion personnel basique",             [false, false, true,  true ]],
  ["QR code > commander + payer",           [false, false, false, true ]],
  ["Analytics avancees",                    [false, false, false, true ]],
  ["Gestion personnel complete",            [false, false, false, true ]],
  ["Design personnalise",                   [false, false, false, true ]],
  ["Notifications push",                    [false, false, false, true ]],
  ["Support prioritaire",                   [false, false, false, true ]],
];

// ── bullet list ────────────────────────────────────────────────────────────────
const bulletItems = [
  "Activer/desactiver un restaurant",
  "Changer le tier d’abonnement par restaurant",
  "Voir les statistiques globales de la plateforme",
  "Activer/desactiver des fonctionnalites specifiques par restaurant",
];

// ── build document ─────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: {
          bold: true,
          size: 48, // 24pt
          color: "000000",
        },
        paragraph: {
          spacing: { before: 400 },
        },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size:    { width: 12240, height: 15840 }, // A4 portrait in DXA
          margin:  { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text:  "Elengi — Confidentiel — 2026",
                  size:  36, // 18pt
                  color: GREY_SUB,
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ── Title ─────────────────────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text:  "Elengi — Tableau des Abonnements Restaurateurs",
              bold:  true,
              size:  64, // 32pt
              color: ORANGE,
            }),
          ],
        }),

        // ── Subtitle ──────────────────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing:   { after: 400 },
          children: [
            new TextRun({
              text:  "Version 1.0 — Mai 2026",
              size:  40, // 20pt
              color: GREY_SUB,
            }),
          ],
        }),

        // ── Table ─────────────────────────────────────────────────────────────
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          rows: [
            // header row
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Fonctionnalite",       0),
                headerCell("MAMAN $3/mois",        1),
                headerCell("ESSENTIEL $10/mois",   2),
                headerCell("CROISSANCE $25/mois",  3),
                headerCell("DOMINATION $45/mois",  4),
              ],
            }),
            // data rows
            ...rows.map(([label, checks], i) => dataRow(label, checks, i)),
          ],
        }),

        // ── Section heading ────────────────────────────────────────────────────
        new Paragraph({
          heading:   HeadingLevel.HEADING_2,
          spacing:   { before: 400 },
          children: [
            new TextRun({
              text: "Controle Admin / Super Admin",
              bold: true,
              size: 48, // 24pt
            }),
          ],
        }),

        // ── Bullet list ────────────────────────────────────────────────────────
        ...bulletItems.map(
          (item) =>
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: item, size: 36 }),
              ],
            })
        ),
      ],
    },
  ],
});

// ── write file ─────────────────────────────────────────────────────────────────
const OUT = path.join(__dirname, "Elengi_Abonnements_Tiers.docx");

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("OK  Written:", OUT);
  console.log("    Size   :", buf.length, "bytes");
}).catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
