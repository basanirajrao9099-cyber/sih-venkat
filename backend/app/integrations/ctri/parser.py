"""
HTML and content parser for Clinical Trials Registry - India (CTRI) public trial pages.
Safely extracts key-value fields from official table layouts without fabricating missing data.
"""

import re
import logging
from typing import Dict, Any, List, Optional
from html.parser import HTMLParser

logger = logging.getLogger("ayu_trial_fabric.ctri_parser")


class SimpleCTRIHTMLParser(HTMLParser):
    """
    Lightweight, dependency-free HTML table text extractor for CTRI trial pages.
    Extracts text cells sequentially from HTML tables.
    """

    def __init__(self):
        super().__init__()
        self.in_cell = False
        self.current_text: List[str] = []
        self.cells: List[str] = []
        self.rows: List[List[str]] = []
        self.current_row: List[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in ["td", "th"]:
            self.in_cell = True
            self.current_text = []
        elif tag == "tr":
            self.current_row = []

    def handle_endtag(self, tag):
        if tag in ["td", "th"]:
            self.in_cell = False
            cell_content = " ".join("".join(self.current_text).split())
            self.current_row.append(cell_content)
        elif tag == "tr":
            if self.current_row:
                self.rows.append(self.current_row)

    def handle_data(self, data):
        if self.in_cell:
            self.current_text.append(data)


def parse_ctri_html(html_content: str, registration_number: str) -> Dict[str, Any]:
    """
    Parse raw HTML string from official CTRI registry page into a dictionary of fields.
    Extracts standard CTRI fields (Public Title, Scientific Title, Intervention, Phase, etc.).
    """
    parser = SimpleCTRIHTMLParser()
    try:
        parser.feed(html_content)
    except Exception as e:
        logger.warning(f"HTML parsing exception on CTRI content: {e}")

    extracted: Dict[str, Any] = {
        "registration_number": registration_number,
        "public_title": None,
        "scientific_title": None,
        "study_type": None,
        "intervention": None,
        "condition": None,
        "primary_objective": None,
        "secondary_objectives": None,
        "study_design": None,
        "phase": None,
        "sample_size": None,
        "inclusion_criteria": None,
        "exclusion_criteria": None,
        "primary_outcomes": None,
        "secondary_outcomes": None,
        "sites": [],
        "sponsor": None,
        "principal_investigator": None,
        "status": None,
        "registration_date": None,
        "last_updated": None,
    }

    # Match extracted key-value pairs from rows
    for row in parser.rows:
        if len(row) >= 2:
            key = row[0].strip().lower()
            val = row[1].strip() if len(row) > 1 else ""

            if not val:
                continue

            if "public title" in key or "title of study" in key:
                extracted["public_title"] = val
            elif "scientific title" in key:
                extracted["scientific_title"] = val
            elif "type of study" in key or "study type" in key:
                extracted["study_type"] = val
            elif "intervention" in key:
                extracted["intervention"] = val
            elif "health condition" in key or "condition" in key:
                extracted["condition"] = val
            elif "phase" in key:
                extracted["phase"] = val
            elif "target sample size" in key or "total sample size" in key or "sample size" in key:
                digits = re.findall(r"\d+", val)
                if digits:
                    extracted["sample_size"] = int(digits[0])
            elif "primary objective" in key:
                extracted["primary_objective"] = val
            elif "secondary objective" in key:
                extracted["secondary_objectives"] = val
            elif "primary outcome" in key:
                extracted["primary_outcomes"] = val
            elif "secondary outcome" in key:
                extracted["secondary_outcomes"] = val
            elif "inclusion criteria" in key:
                extracted["inclusion_criteria"] = val
            elif "exclusion criteria" in key:
                extracted["exclusion_criteria"] = val
            elif "primary sponsor" in key or "sponsor" in key:
                extracted["sponsor"] = val
            elif "principal investigator" in key or "scientific contact" in key:
                extracted["principal_investigator"] = val
            elif "recruitment status" in key or "status" in key:
                extracted["status"] = val
            elif "date of registration" in key or "registration date" in key:
                extracted["registration_date"] = val
            elif "last modified" in key or "last updated" in key:
                extracted["last_updated"] = val

    return extracted
