import { filterPipeline } from "rdffilter"
import { Quad, NamedNode } from "n3"

const relativeIRI = iri => iri.startsWith("file://") || !/^(?:[a-z+]+:)/i.test(iri)
const isRelative = node => node.termType === "NamedNode" && relativeIRI(node.id)

class NamespaceReplacer {
  constructor(map) {
    this.map = map 
  }
  replaceNamespace(iri) {
    for (let ns in this.map) {
      if (iri.startsWith(ns)) {
        return this.map[ns] + iri.substr(ns.length)
      }
    }
    return null
  }
  filterTerm(term) {
    if (term.termType == "NamedNode") {
      const id = this.replaceNamespace(term.id)
      if (id) return new NamedNode(id)
    }
  }
  filterTriple(triple) {
    const subject = this.filterTerm(triple.subject)
    const predicate = this.filterTerm(triple.predicate)
    const object = this.filterTerm(triple.object)

    if (subject || predicate || object) {
      return new Quad(subject || triple.subject, predicate || triple.predicate, object || triple.object)
    }
    return true
  }
}

class NamespaceFilter {
  constructor(namespaces) {
    // TODO: build Trie data structure for faster lookup
    this.namespaces = namespaces
  }
  filterTerm(term) {
    if (term.termType === "NamedNode") {
      for (let ns of this.namespaces) {
        if (term.id.startsWith(ns)) return
      }
    }
    return true
  }
  filterTriple({ subject, predicate, object }) {
    return this.filterTerm(subject) && this.filterTerm(predicate) && this.filterTerm(object)
  }
}

const nsReplace = new NamespaceReplacer({
  "http://www.ics.forth.gr/isl/CRMsci/": "http://www.cidoc-crm.org/extensions/crmsci/",
  "http://www.ics.forth.gr/isl/CRMinf/": "http://www.cidoc-crm.org/extensions/crminf/",
  "http://www.ics.forth.gr/isl/CRMdig/": "http://www.cidoc-crm.org/extensions/crmdig/",
  "http://purl.org/dc/terms/": "http://purl.org/dc/elements/1.1/",
  "http://cidoc-crm.org/current/": "http://www.cidoc-crm.org/cidoc-crm/",
  "http://erlangen-crm.org/170309/": "http://www.cidoc-crm.org/cidoc-crm/",
})

const nsDisallow = new NamespaceFilter([
  "http://d-nb.info/gnd/",
  "http://purl.org/dc/elements/1.1/",
  "http://vocab.getty.edu/aat/",
  "http://www.cidoc-crm.org/",
  "http://www.w3.org/2000/01/rdf-schema",
  "http://www.w3.org/2001/XMLSchema#",
  "http://www.w3.org/2002/07/owl#",
  "http://www.w3.org/2004/02/skos/core#",
  "http://www.w3.org/ns/prov#",
  "http://www.wikidata.org/entity/",
//  "https://iconclass.org/", TODO: http or https?
  "http://iconclass.org/",
])

export default filterPipeline([
  // disallow relative IRIs
  ({subject, object}) => !(isRelative(subject) || isRelative(object)),
  // replace known legacy namespaces
  triple => nsReplace.filterTriple(triple),
  // disallow as subject
  ({subject}) => nsDisallow.filterTerm(subject),
])
