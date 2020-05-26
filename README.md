
# pedigreejs

This version of pedigreejs is a webtool build with the javascript module of
the [Centre for Cancer Genetic Epidemiology - BOADICEA group](https://ccge.medschl.cam.ac.uk/boadicea/). The original module can be found on the [project page](https://ccge-boadicea.github.io/pedigreejs/).
This webtool is meant to support two usecases:

1. Draw a pedigree and export it in the correct file format for the [CanRisk](https://canrisk.org/) cancer risk prediction.
2. Draw a pedigree with a user-defined set of diseases

The user can define her/his own pehontype set at the beginning of a new pedigree or afterwards if something changed.
This configuration features autocomplete for a predefined set of HPO terms.

## For Users

The pedigree features three areas, the menu, the pedigree area and the family member configuration.

### Menu

General Functions:<br/>
*New* - Deletes the current disease configuration and pedigree to start a new one<br/>
*Load* - Loads a previously saved pedigree or a pedigree in the BOADICEA file format<br/>
*Save* - Saves the current pedigree and all actively occuring diseases in the JSON file format<br/>
Configuration:<br/>
*Configure Diseases* - Opens a configuration window that allows the user to define her/his own set of dieseases/phenotypes. The input field features an autocomplete for a set of predefined HPO terms.<br/>
Export in different file formats:<br/>
*Export BOADICEA* - Exports the current pedigree in the BOADICEA format for the CanRisk cancer prediction. This requires that all sexes and a proband is defined.<br/>
*Print* - Opens a print dialog for the current pedigree<br/>
*SVG* - Exports the current pedigree in as svg<br/>
*PNG* - Exports the currently visible part of the pedigree as PNG picture<br/>

### Pedigree

The pedigree is able to show all common family histories. On hover six different symbols might appear:

1. *Arrow up* - Add parents. Only for parentless individuals. Both parents will be added to the pedigree and two configuration windows will pop up, one for each parent
2. *Arrow down* - Add child. Only for parents. A child gets added to the relationship and a configuration window will pop up. If twins are selected two configuration windows will pop up.
3. *Arrow right* - Add sibling. Only for children. Like 'Add child' a child gets added to the relationship and a configuration window will pop up.
4. *Chains* - Add partner. Only for individuals with up to one partner. Adds a partner and a child to the pedigree.
5. *X* - Delete. Deletes the individual of the pedigree.
6. *■* - Consanguity. Two individuals can be connected as consangious partners if somewhere in the pedigree the derive form the same relationship.

### Individual configuration

This window shows the name of the currently added individual in the top left corner. There are four distinct sections:<br/>
*General Info* - Information about the individual, like age, year of birth, sex, etc.<br/>
*Age of Diagnosis* - Information about the age of diagnosis of the diseases/phenotypes.<br/>
*Genetic Tests* - A list of genetic tests required for the export to the BOADICEA format. The test can be a mutation search or a genetic gene test.<br/>
*Pathology Tests* - A list of test about the pathology of certain conditions being pathologic.<br/>


## For Developers

### Dependencies

This webtool uses three external libraries:

#### jQuery and jQuery-UI

[jQuery](https://jquery.com/) and [jQuery-UI](https://jqueryui.com/) are used to make the webtool more compatible
between different browsers and easier implementation. The jQuery version used is 3.2.1, the version of jQuery-UI is 1.12.0.

#### D3

The [D3 library](https://d3js.org/) is used to draw the pedigree itself as svg. This webtool is using version 4.13.0.

#### Bootstrap

The [Bootstrap](https://getbootstrap.com/) library provides many basic functionalities of used forms.

### General Structure

The functionality of this tool is provided by the files [index.html](./index.html), [btn_setup.js](./js/btn_setup.js), [input_validation](./js/input_validation), [io.js](./js/io.js), [pedigree_form.js](./js/pedigree_form.js), [pedigree.js](./js/pedigree.js), [undo_redo_refresh.js](./js/undo_redo_refresh.js) and [widget.js](./js/widget.js).

1. [index.html](./index.html) - The structure of the tool. Provides divs and buttons. Gets extended by the JavaScript files.
2. [pedigree.js](./js/pedigree.js) - The main file for the generation of the pedigree. Contains the classes 'pedigree_util' and 'ptree'
3. [pedigree_form.js](./js/pedigree_form.js) - Contains the class 'pedigree_form'. Contains functions to save information from the 'fh_settings' div to the options and save them in the browser cache. Gets called everytime a change happens in the individual configuration.
4. [io.js](./js/io.js) - Contains functions for importing and exporting pedigrees. Contains the 'save_BOADICEA' function
5. [undo_redo_refresh.js](./js/undo_redo_refresh.js) - Functions for caching functionality and undo/redo
6. [widget.js](./js/widget.js) - Every interactable svg element gets it's function from this file.
7. [input_validation](./js/input_validation) - Contains function for validating the input given by the user and providing the autocomplete for the HPO terms
8. [btn_setup.js](./js/btn_setup.js) - Contains the functionality of the 'Change Disease' button (and the corresponding diseases configuration window) and the dialog for making a new pedigree

The general idea is, that there is one 'opts' object (in [index.html](./index.html)), which contains all relevant information for all functions. Most functions only use the opts.dataset attribute, since that contains the pedigree with all informations as object (dictionary).

## Future Developments

1. Support for genetic tests for RAD51D, RAD51C, and BRIP1 as they are currently not featured in the BOADICEA file format.
2. Keep the complete disease configuration on save, despite some diseases may not being used in the pedigree
3. When adding a partner to a family member of unkown gender, an error aswell as the configuration windows get opened. Prevent windows from open when an error gets displayed.
4. Display warnings when changing gender from female to male and if diagnosis age is incompatible with actual age
5. Check for self-defined diseases only being an HPO term