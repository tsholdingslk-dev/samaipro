import re
from bs4 import BeautifulSoup
from typing import List


class TextProcessor:
    @staticmethod
    def clean_html(raw_html: str) -> str:
        soup = BeautifulSoup(raw_html, "html.parser")
        for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
            element.extract()
        text = soup.get_text(separator=" ")
        clean_text = re.sub(r"\s+", " ", text).strip()
        return clean_text

    @staticmethod
    def create_chunks(text: str, chunk_size: int = 750, overlap: int = 100) -> List[str]:
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            if len(chunk) > 50:
                chunks.append(chunk)
        return chunks
