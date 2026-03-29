/**
 * Parse a PubChem PUG View Record into a flat summary object
 * suitable for sending to an LLM for decomposition.
 *
 * PUG View records are deeply nested section trees. We walk them
 * and extract content from biomedically relevant headings.
 */

const RELEVANT_HEADINGS = new Set([
  'Mechanism of Action',
  'Pharmacology',
  'Pharmacological Classification',
  'Drug Classes',
  'Protein Targets',
  'Targets',
  'Drug Targets',
  'Biological Target',
  'Bioassay Results',
  'Metabolism/Metabolites',
  'Absorption, Distribution and Excretion',
  'ATC Code',
  'Clinical Trials',
  'Drug Indication',
  'Drug Interactions',
  'FDA Pharmacological Classification',
  'MeSH Pharmacological Classification',
])

/**
 * Recursively walk the section tree and collect matching sections.
 */
function walkSections(section, collected) {
  if (!section) return

  const heading = section.TOCHeading

  if (heading && RELEVANT_HEADINGS.has(heading)) {
    collected.push({
      heading,
      text: extractText(section),
    })
  }

  if (section.Section) {
    for (const child of section.Section) {
      walkSections(child, collected)
    }
  }
}

/**
 * Extract readable text from a section's Information array.
 * PUG View stores content as Information → Value → StringWithMarkup.
 */
function extractText(section) {
  const lines = []

  if (section.Information) {
    for (const info of section.Information) {
      const val = info.Value

      if (val?.StringWithMarkup) {
        for (const item of val.StringWithMarkup) {
          if (item.String) lines.push(item.String)
        }
      }

      if (val?.Number) {
        lines.push(val.Number.join(', '))
      }
    }
  }

  if (section.Section) {
    for (const child of section.Section) {
      const childText = extractText(child)
      if (childText) lines.push(childText)
    }
  }

  return lines.join('\n').trim()
}

/**
 * Parse a PUG View Record into a normalized summary.
 *
 * @param {object} record - The Record object from PUG View JSON.
 * @returns {{ cid: number, name: string, sections: Array<{heading: string, text: string}> }}
 */
export function parseCompoundRecord(record) {
  const cid = record.RecordNumber
  const name = record.RecordTitle || `CID ${cid}`

  const collected = []

  if (record.Section) {
    for (const topSection of record.Section) {
      walkSections(topSection, collected)
    }
  }

  const sections = collected.filter((s) => s.text.length > 0)

  return { cid, name, sections }
}
