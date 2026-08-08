from fpdf import FPDF

def generate_pdf(summary, problem_points):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.cell(200, 10, txt="Dental Cavity Detection Report", ln=1, align='C')

    pdf.ln(10)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Summary:", ln=1)

    pdf.set_font("Arial", "", 11)
    pdf.multi_cell(0, 8, summary)

    pdf.ln(5)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Detected Problems:", ln=1)

    pdf.set_font("Arial", "", 11)
    for p in problem_points:
        pdf.multi_cell(0, 8, f"- {p}")

    file_path = "report.pdf"
    pdf.output(file_path)
    return file_path
