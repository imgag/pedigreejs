import sys
import csv
import json
import os

# read hpo_terms
print("HPO-terms\n")
filepath = os.path.dirname(__file__) + "/hpo_terms.tsv"
hpoterms = []
try:
    with open(filepath, encoding='utf-16') as tsvfile:
        reader = csv.DictReader(tsvfile, dialect='excel-tab') #ID   NAME   IS_A   IS_OBSOLETE   SYNONYM   DEF
        for row in reader:
            entry = {'HPO_ID': row['ID'], 'HPO_NAME': row['NAME'], 'HPO_SYNONYM': row['SYNONYM']}
            if entry not in hpoterms:
                hpoterms.append(entry)
except IOError:
        print("error:", filepath, "does not seem to exist.")
        sys.exit()

# read HGNC genes
print("HGNC-terms\n")
filepath = os.path.dirname(__file__) + "/hgnc_genes.txt"
hgncgenes = []
try:
    with open(filepath, encoding='utf-8') as tsvfile:
        reader = csv.DictReader(tsvfile, dialect='excel-tab') #HGNC ID	Status	Approved symbol	Approved name	Alias symbol	Alias name	Previous symbol	Previous name

        for row in reader:
            # TODO only keep approved symbols
            hgnc_id = row['HGNC ID']
            approved = row['Approved symbol']
            alias = row['Alias symbol']
            previous = row['Previous symbol']

            found = False
            for gene in hgncgenes:
                if gene['HGNC_ID'] == hgnc_id:
                    found = True

                    if approved not in gene['APPROVED'].split(','):
                        gene['APPROVED'] += ',' + approved
                    if alias not in gene['ALIAS'].split(','):
                        gene['ALIAS'] += ',' + alias
                    if previous not in gene['PREVIOUS'].split(','):
                        gene['PREVIOUS'] += ',' + previous

            entry = {'HGNC_ID': hgnc_id, 'APPROVED': approved, 'ALIAS': alias, 'PREVIOUS': previous}
            if not found:
                hgncgenes.append(entry)

except IOError:
        print("error:", filepath, "does not seem to exist.")
        sys.exit()


# write ressources file
print("write ressource file\n")
try:
    with open (os.path.dirname(__file__) + '/res.js', mode='w') as writefile:
        writefile.write("var hpo_terms = " + json.dumps(hpoterms))
        writefile.write("\n")
        writefile.write("var hgnc_ids = " + json.dumps(hgncgenes))
        writefile.close
except IOError:
        print("error:", filepath, "couldn't be written to.")
        sys.exit()