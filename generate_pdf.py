import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def build_pdf():
    pdf_filename = "/Users/haripriya/Design Task/Design_Companion_Case_Study.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    # Table Cell Styles
    th_style = ParagraphStyle(
        'THStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#FFFFFF')
    )

    td_style = ParagraphStyle(
        'TDStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#334155')
    )

    td_bold_style = ParagraphStyle(
        'TDBoldStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#0F172A')
    )

    td_link_style = ParagraphStyle(
        'TDLinkStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#2563EB')
    )

    box_text_style = ParagraphStyle(
        'BoxText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # Title Banner
    story.append(Paragraph("Design Companion — Case Study & UX Specification", title_style))
    story.append(Paragraph("Challenge 1 Submission: AI Usability Triage, Layout Exploration & Microcopy Studio", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#CBD5E1'), spaceAfter=12))

    # SECTION 1: HOW I APPROACHED THIS PROBLEM
    story.append(Paragraph("1. How I Approached This Problem", h1_style))
    
    story.append(Paragraph(
        "Post-usability testing analysis is often messy. After 5 or 6 moderated sessions, design teams end up with 20+ scattered observations, timestamps, and verbatim quotes across spreadsheets or Notion docs. Synthesizing these notes into prioritized Jira tickets usually takes hours of manual tagging and subjective debates about what is 'critical' versus what is just a minor preference.",
        body_style
    ))
    
    story.append(Paragraph(
        "I wanted to build a practical tool that sits right beside a UX designer during or immediately after testing sessions — acting as an intelligent assistant that does the heavy lifting of categorizing notes, ranking severity, and translating pain points directly into design solutions.",
        body_style
    ))

    story.append(Paragraph("Core Design Principles & Mental Model:", h2_style))
    story.append(Paragraph("• <b>Grounding in Nielsen's Heuristics:</b> Instead of inventing arbitrary tag names, raw feedback is evaluated against established UX benchmarks (e.g., <i>Visibility of System Status</i>, <i>Error Prevention</i>, <i>Recognition rather than Recall</i>).", bullet_style))
    story.append(Paragraph("• <b>Objective Severity Scoring:</b> Priorities shouldn't depend on who speaks loudest in the room. I designed a deterministic severity formula: <code>Severity = (2 × Blockers) + (1.5 × Total Notes) + Participant Spread</code> to rank friction points mathematically.", bullet_style))
    story.append(Paragraph("• <b>Tactile Synthesis Wall:</b> Rather than cold data tables, findings are rendered as warm golden-yellow sticky notes (#FDC770) on a pitch-black OLED canvas (#000000), mimicking physical post-it walls in design war rooms.", bullet_style))
    story.append(Paragraph("• <b>Direct Actionability:</b> Triage isn't the end. The companion connects research findings to immediate design actions: generating 4 wireframe layout concepts and writing 3 microcopy options.", bullet_style))

    story.append(Spacer(1, 10))

    # SECTION 2: USER FLOW (Wrapped Paragraphs to prevent overlap)
    story.append(Paragraph("2. Complete User Flow Walkthrough", h1_style))

    raw_flow_data = [
        ["Step", "User Action", "System Processing & AI Logic", "Outcome / Screen State"],
        [
            "01",
            "Upload or Paste Transcript",
            "System strips VTT/SRT timestamp headers and moderator chatter. Normalizes text into structured participant statements.",
            "Raw notes populated in sidebar text area with line count indicators."
        ],
        [
            "02",
            "Trigger Triage Analysis",
            "Classifier maps notes to Nielsen's 10 Heuristics, tags severity levels, and extracts verbatim participant quotes.",
            "Usability Synthesis Wall renders golden sticky note cards ranked by impact."
        ],
        [
            "03",
            "Review Sticky Notes",
            "Designer reviews recommended fixes (✓ checkmarks) and participant evidence (P1–P6 quotes) permanently expanded.",
            "Immediate clarity on top critical blockers requiring design intervention."
        ],
        [
            "04",
            "Explore Layout Directions",
            "User switches to 'Brainstorm' tab. System generates structured prompts for 4 wireframe layouts (Split-screen, Accordion, Stepper, Card grid).",
            "Ready-to-use prompts for Figma wireframing or AI layout generation."
        ],
        [
            "05",
            "Generate UI Microcopy",
            "User switches to 'UI Copy' tab. System generates 3 distinct copy variants (Direct, Helpful, Minimal) under strict word limits.",
            "Copy options ready to copy-paste into UI button states and error banners."
        ],
        [
            "06",
            "Export Results",
            "User clicks 'Export JSON' in the capsule navbar.",
            "Formatted JSON payload copied to clipboard for team documentation & Jira."
        ]
    ]

    # Convert raw string cells into Paragraph flowables
    flow_table_cells = []
    for r_idx, row in enumerate(raw_flow_data):
        cell_row = []
        for c_idx, cell_text in enumerate(row):
            if r_idx == 0:
                cell_row.append(Paragraph(cell_text, th_style))
            elif c_idx == 0 or c_idx == 1:
                cell_row.append(Paragraph(cell_text, td_bold_style))
            else:
                cell_row.append(Paragraph(cell_text, td_style))
        flow_table_cells.append(cell_row)

    # colWidths sum = 30 + 110 + 190 + 174 = 504 (Exact page body width)
    t = Table(flow_table_cells, colWidths=[30, 110, 190, 174])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#FFFFFF')),
        ('BACKGROUND', (0,2), (-1,2), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (0,3), (-1,3), colors.HexColor('#FFFFFF')),
        ('BACKGROUND', (0,4), (-1,4), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (0,5), (-1,5), colors.HexColor('#FFFFFF')),
        ('BACKGROUND', (0,6), (-1,6), colors.HexColor('#F8FAFC')),
    ]))
    story.append(t)

    story.append(Spacer(1, 14))

    # SECTION 3: SUBMISSION FORM / REQUIREMENT CHECKLIST
    story.append(Paragraph("3. Official Submission Details", h1_style))

    # 100-word Summary Box
    summary_box_content = [
        [Paragraph("<b>100-WORD SUMMARY (IDEA & APPROACH):</b>", box_text_style)],
        [Paragraph(
            "Design Companion is an AI-powered triage and design workbench that transforms raw, unorganized usability session notes into actionable, heuristic-mapped fix lists, layout exploration briefs, and UX copy options.<br/><br/>"
            "Built with Next.js and Shadcn UI, it features an automated classification engine mapping feedback to Nielsen’s 10 Heuristics with a deterministic severity score (2 × Blockers + 1.5 × Notes + Spread). It accepts Zoom/Teams .vtt transcripts, displays clean sticky-note feedback cards, and includes dynamic prompt generators for instant wireframing and microcopy iterations. <i>(83 words)</i>",
            box_text_style
        )]
    ]
    summary_table = Table(summary_box_content, colWidths=[504])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF3C7')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#F59E0B')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(summary_table)

    story.append(Spacer(1, 10))

    # Links Section
    story.append(Paragraph("<b>PUBLIC LINKS & SUBMISSION ASSETS:</b>", h2_style))
    
    raw_links = [
        ["Asset", "Public URL / Details"],
        ["Live Interactive Prototype", "https://panamparanarasu.github.io/Design-Companion/"],
        ["Public GitHub Repository", "https://github.com/PanamparanArasu/Design-Companion"],
        ["Usability Dataset (.csv)", "https://github.com/PanamparanArasu/Design-Companion/blob/main/usability-notes.csv"],
        ["Tech Stack", "Next.js 16, Shadcn UI, Tailwind CSS, Framer Motion, Geist Font System"]
    ]

    link_table_cells = []
    for r_idx, row in enumerate(raw_links):
        cell_row = []
        for c_idx, cell_text in enumerate(row):
            if r_idx == 0:
                cell_row.append(Paragraph(cell_text, th_style))
            elif c_idx == 0:
                cell_row.append(Paragraph(cell_text, td_bold_style))
            else:
                cell_row.append(Paragraph(cell_text, td_link_style if r_idx <= 3 else td_style))
        link_table_cells.append(cell_row)
    
    t_links = Table(link_table_cells, colWidths=[140, 364])
    t_links.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t_links)

    doc.build(story)
    print("PDF re-compiled successfully:", pdf_filename)

if __name__ == '__main__':
    build_pdf()
