
## pedigreejs

This version of pedigreejs is a webtool build with the javascript module of
the [Centre for Cancer Genetic Epidemiology - BOADICEA group](https://ccge.medschl.cam.ac.uk/boadicea/). The original module can be found on the [project page](https://ccge-boadicea.github.io/pedigreejs/).
This webtool is meant to support two usecases:

1. Draw a pedigree and export it in the correct file format for the [CanRisk](https://canrisk.org/) cancer risk prediction.
2. Draw a pedigree with a user-defined set of phenotypes

The user can define her/his own pehontype set at the beginning of a new pedigree or afterwards if something changed.
This configuration features autocomplete for a redefined set of HPO terms.

## Resources

This webtool uses three external libraries:

### jQuery and jQuery-UI

[jQuery](https://jquery.com/) and [jQuery-UI](https://jqueryui.com/) are used to make the webtool more compatible
between different browsers and easier implementation. The jQuery version used is 3.2.1, the version of jQuery-UI is 1.12.0.

### D3

The [D3 library](https://d3js.org/) is used to draw the pedigree itself as svg. This webtool is using version 4.13.0.

### Bootstrap

The [Bootstrap](https://getbootstrap.com/) library provides many basic functionalities of used forms.

## For Developers

