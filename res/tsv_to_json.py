import sys
import csv
import json

filepath = "hpo_terms.txt"
hpoterms = []

try:
    with open(filepath) as tsvfile:
        reader = csv.DictReader(tsvfile, dialect='excel-tab') #ID   NAME   IS_A   IS_OBSOLETE   SYNONYM   DEF
        for row in reader:
            entry = {'sterm': row['ID'] + ' ' + row['NAME'] + ' ' + row['IS_A']  + ' ' + row['SYNONYM']  + ' ' + row['DEF'],
                        'display-name': row['ID'] + ' (' + row['NAME'] + ')'}
            hpoterms.append(entry)
except IOError:
        print("error:", filepath, "does not seem to exist.")
        sys.exit()

try:
    with open ('hpo.json', 'w') as writefile:
        writefile.write(json.dumps(hpoterms))
        writefile.close
except IOError:
        print("error:", filepath, "couldn't be written to.")
        sys.exit()