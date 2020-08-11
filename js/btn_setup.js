function btn_setup(opts) {
    // adds the functionality of the 'New' button
    $('#newPedigree').click(function (e) {
        $('<div id="msgDialog">Sarting a new pedigree results in loss of all current data. Proceed?</div>').dialog({
            title: 'Confirm Starting New',
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                Continue: function () {
                    // reset diseases to default
                    newdataset = ptree.copy_dataset(pedcache.current(opts));
                    opts.dataset = newdataset;
                    opts.diseases = $.extend(true, [], DEFAULT_DISEASES);
                    opts.additional_diseases = [];
                    ptree.rebuild(opts);
                    update_diseases();
                    localStorage.setItem('diseases', JSON.stringify(opts.diseases));
                    localStorage.setItem('additional_diseases', JSON.stringify(opts.additional_diseases));
                    // open disease configuration and reset nodes in pedigree
                    $('#fh_settings').dialog('open');
                    pbuttons.reset(opts, opts.keep_proband_on_reset);
                    $(this).dialog("close");
                },
                Cancel: function () {
                    $(this).dialog("close");
                    return;
                }
            }
        });
    });

    // adds the functionality of the disease list button
    $('#fh_settings').dialog({
        autoOpen: false,
        title: "Disease List",
        width: 368
    });
    var html_dis = '<div id="disease_table"></div>';

    function make_dis_list(dis_list, is_default) {
        list = '';

        $.each(dis_list, function (k, v) {
            var deleteBtn = '<td style="text-align:left;"><label class="btn btn-default btn-file btn-remove" id="delete_disease-' + v.type + '">' +
                '<input type="button" style="display: none;"/>' +
                '<i class="fa fa-minus" aria-hidden="true"></i>' +
                '</label></td>';

            if (is_default) {
                list += "<tr><td style='text-align:center;'><div class='scrollable'>" +
                    v.hpo + "&nbsp;</div></td>" +
                    deleteBtn +
                    "</tr>";
            } else {
                list += "<tr><td style='text-align:center;'><div class='scrollable'>" +
                    capitaliseFirstLetter(v.type.replace(/_/g, " ")) + "&nbsp;</div></td>" +
                    deleteBtn +
                    "</tr>";
            }
        });

        return list;
    }

    function save_changes() {
        newdataset = ptree.copy_dataset(pedcache.current(opts));
        opts.dataset = newdataset;
        ptree.rebuild(opts);
    }

    function delete_disease(this_disease) {
        // copy current diseases to make changes
        var new_diseases = $.extend(true, [], opts.diseases);
        var new_add_diseases = $.extend(true, [], opts.additional_diseases);
        // filter current diseases
        new_diseases = new_diseases.filter(function (el) {
            return el.type !== this_disease;
        });
        new_add_diseases = new_add_diseases.filter(function (el) {
            return el.type !== this_disease;
        });
        // overwrite current diseases with filtered ones
        opts.diseases = new_diseases;
        opts.additional_diseases = new_add_diseases;
        // save changes in browser cache
        localStorage.setItem('diseases', JSON.stringify(opts.diseases));
        localStorage.setItem('additional_diseases', JSON.stringify(opts.additional_diseases));

        update_diseases();
        save_changes();
    }

    function delete_dis_ages(this_disease) {
        var new_dataset = ptree.copy_dataset(opts.dataset);
        $.each(new_dataset, function (k, v) {
            if (v[this_disease + '_diagnosis_age']) {
                delete v[this_disease + '_diagnosis_age'];
            }
        });
        opts.dataset = new_dataset;
        ptree.rebuild(opts);
    }

    function update_diseases() {
        var tab = "<table>";

        tab += '<tr>' +
            '<td style="text-align:left;font-weight: bold;" colspan="2">' +
            'For CanRisk Prediction:' +
            '</td></tr>';
        tab += make_dis_list(opts.diseases, true);
        // reset Boadicea
        tab += '<tr class="spaceUnder">' +
            '<td style="text-align:center;" colspan="2">' +
            '<label class="btn btn-default btn-file reset-btn">' +
            '<input id="restore_boadicea" type="button" style="display: none;"/>' +
            'Restore BOADICEA' +
            '</label></td></tr>';

        tab += '<tr>' +
            '<td style="text-align:left;font-weight: bold;" colspan="2">' +
            'Self-defined diseases:' +
            '</td></tr>';
        tab += make_dis_list(opts.additional_diseases, false);

        // add a disease button
        tab += '<tr><td>' +
            '<input type="text" class="form-control ui-autocomplete-input" id="dis_name"><datalist id="hpo_list"></datalist></td>' +
            '<td style="text-align:left;">' +
            '<label class="btn btn-default btn-file btn-add-dis">' +
            '<input id="add_disease" type="button" style="display: none;"/>' +
            '<i class="fa fa-plus" aria-hidden="true"></i>' +
            '</label></td></tr>';

        // reset default
        tab += '<tr>' +
            '<td style="text-align:center;" colspan="2">' +
            '<label class="btn btn-default btn-file reset-btn">' +
            '<input id="reset_diseases" type="button" style="display: none;"/>' +
            'Restore Default' +
            '</label></td></tr>'

        tab += "</table>";
        $('#disease_table').html(tab);

        $('#dis_name').autocomplete({
            minLength: 2,
            source: function (request, response) {
                response(hpo_terms.filter(function (entry) {
                    return entry['HPO_NAME'].toLowerCase().includes(request['term'].toLowerCase());
                }).map(function (entry) {
                    return entry['HPO_NAME'];
                }).sort());
            }
        });

        $("label[id^='delete_disease-']").on("click", function () {
            var this_disease = $(this).attr('id').replace('delete_disease-', '');
            $("#delete_dialog").dialog({
                modal: true,
                buttons: {
                    Yes: function () {
                        delete_dis_ages(this_disease);
                        delete_disease(this_disease);
                        $(this).dialog("close");
                    },
                    No: function () {
                        $(this).dialog("close");
                    }
                }
            });
            $("#delete_dialog").html("This will delete '" + capitaliseFirstLetter(this_disease.replace(/_/g, " ")) + "' from the list and all "
                + "corresponding records in the pedigree. Are you sure?");
        });

        $('#add_disease').on("click", function () {
            if ($('#dis_name').val() == "")
                return;
            var new_diseases = $.extend(true, [], opts.additional_diseases);
            new_diseases.push({ 'type': $('#dis_name').val().replace(/\s/g, "_"), 'colour': 'grey' });
            opts.additional_diseases = new_diseases;
            localStorage.setItem('additional_diseases', JSON.stringify(opts.additional_diseases));
            if (opts.DEBUG) {
                console.log(localStorage.additional_diseases);
                console.log(opts.additional_diseases);
            }
            update_diseases();
            save_changes();
        });

        $('#reset_diseases').on("click", function () {
            $("#reset_dialog").dialog({
                modal: true,
                buttons: {
                    Yes: function () {
                        newdataset = ptree.copy_dataset(pedcache.current(opts));
                        opts.dataset = newdataset;
                        opts.diseases = $.extend(true, [], DEFAULT_DISEASES);
                        opts.additional_diseases = [];
                        ptree.rebuild(opts);
                        update_diseases();
                        localStorage.setItem('diseases', JSON.stringify(opts.diseases));
                        localStorage.setItem('additional_diseases', JSON.stringify(opts.additional_diseases));
                        $(this).dialog("close");
                    },
                    No: function () {
                        $(this).dialog("close");
                    }
                }
            });
            $("#reset_dialog").html("This deletes all diseases besides the ones important for BOADICEA CanRisk prediction and restores the default." +
                " All corresponding records in the pedigree will be lost!");
        });

        $('#restore_boadicea').on('click', function (e) {
            $("#reset_dialog").dialog({
                modal: true,
                buttons: {
                    Yes: function () {
                        newdataset = ptree.copy_dataset(pedcache.current(opts));
                        opts.dataset = newdataset;
                        opts.diseases = $.extend(true, [], DEFAULT_DISEASES);
                        ptree.rebuild(opts);
                        update_diseases();
                        localStorage.setItem('diseases', JSON.stringify(opts.diseases));
                        $(this).dialog("close");
                    },
                    No: function () {
                        $(this).dialog("close");
                    }
                }
            });
            $("#reset_dialog").html("This restores all diseases important for BOADICEA CanRisk prediction.");
        });
    }

    $('#fh_settings').html(html_dis);
    update_diseases();

    $('#fh_edit_settings').on("click", function () {
        update_diseases();
        $('#fh_settings').dialog('open');
    });
	
	   // adds the functionality of the gene configuration button
    $('#fh_settings2').dialog({
        autoOpen: false,
        title: "Gene Configuration",
        width: 300
    });
    var html_gns = '<div id="gene_table"></div>';

    function make_gns_list(gns_list) {
        list = '';

        $.each(gns_list, function (k, v) {
            var deleteBtn = '<td style="text-align:left;"><label class="btn btn-default btn-file btn-remove" id="delete_gene-' + v.name + '">' +
                '<input type="button" style="display: none;"/>' +
                '<i class="fa fa-minus" aria-hidden="true"></i>' +
                '</label></td>';

            list += "<tr><td style='text-align:center;'>" +
                capitaliseFirstLetter(v.name.replace(/_/g, " ")) + "&nbsp;</td>" +
                deleteBtn +
                "</tr>";
        });

        return list;
    }

    function save_changes() {
        newdataset = ptree.copy_dataset(pedcache.current(opts));
        opts.dataset = newdataset;
        ptree.rebuild(opts);
    }

    function delete_gene(this_gene) {
        // copy current genes to make changes
        var new_genes = $.extend(true, [], opts.gene_tests);
        var new_add_genes = $.extend(true, [], opts.additional_gene_tests);
        // filter current genes
        new_genes = new_genes.filter(function (el) {
            return el.name !== this_gene;
        });
        new_add_genes = new_add_genes.filter(function (el) {
            return el.name !== this_gene;
        });
        // overwrite current genes with filtered ones
        opts.gene_tests = new_genes;
        opts.additional_gene_tests = new_add_genes;
        // save changes in browser cache
        localStorage.setItem('gene_tests', JSON.stringify(opts.gene_tests));
        localStorage.setItem('additional_gene_tests', JSON.stringify(opts.additional_gene_tests));

        update_genes();
        save_changes();
    }

    function delete_genes_explanation(this_gene) {
        var new_dataset = ptree.copy_dataset(opts.dataset);
        $.each(new_dataset, function (k, v) {
            if (v[this_gene + '_explanation']) {
                delete v[this_gene + '_explanation'];
            }
        });
        opts.dataset = new_dataset;
        ptree.rebuild(opts);
    }

    function update_genes() {

        // TODO implement autocomplete based on HGNC-terms here
        // TODO update style elements so that the dialog is properly displayed

        var tab = "<table>";

        tab += make_gns_list(opts.gene_tests);
        tab += make_gns_list(opts.additional_gene_tests);

        // add a gene button
        tab += '<tr><td>' +
            '<input type="text" class="form-control ui-autocomplete-input" id="gns_name"><datalist id="gene_list"></datalist></td>' +
            '<td style="text-align:left;">' +
            '<label class="btn btn-default btn-file btn-add-gns">' +
            '<input id="add_gene" type="button" style="display: none;"/>' +
            '<i class="fa fa-plus" aria-hidden="true"></i>' +
            '</label></td></tr>';

        // reset genes
        tab += '<tr>' +
            '<td style="text-align:center;" colspan="2">' +
            '<label class="btn btn-default btn-file reset-btn">' +
            '<input id="reset_genes" type="button" style="display: none;"/>' +
            'Restore Default' +
            '</label><label class="btn btn-default btn-file reset-btn">' +
            '<input id="restore_boadicea" type="button" style="display: none;"/>' +
            'Restore BOADICEA' +
            '</label></td></tr>';

        tab += "</table>";
        $('#gene_table').html(tab);

        $('#gns_name').autocomplete({
            minLength: 3,
           source: function (request, response) {
                response(hgnc_ids.filter(function (entry) {
                   return entry['APPROVED'].toLowerCase().includes(request['term'].toLowerCase());
                }).map(function (entry) {
                    return entry['APPROVED'];
                }));
            }
        });

        $("label[id^='delete_gene-']").on("click", function () {
            var this_gene = $(this).attr('id').replace('delete_gene-', '');
            $("#delete_dialog").dialog({
                modal: true,
                buttons: {
                    Yes: function () {
                        delete_genes_explanation(this_gene);
                        delete_gene(this_gene);
                        $(this).dialog("close");
                    },
                    No: function () {
                        $(this).dialog("close");
                    }
                }
            });
            $("#delete_dialog").html("This will delete '" + capitaliseFirstLetter(this_gene.replace(/_/g, " ")) + "' from the list. Are you sure?");
        });

        $('#add_gene').on("click", function () {
            if ($('#gns_name').val() == "")
                return;
            var new_genes = $.extend(true, [], opts.additional_gene_tests);
            new_genes.push({ 'name': $('#gns_name').val().replace(/\s/g, "_"), 'explanation': '?' });
            opts.additional_gene_tests = new_genes;
            localStorage.setItem('additional_gene_tests', JSON.stringify(opts.additional_gene_tests));
            if (opts.DEBUG) {
                console.log(localStorage.additional_gene_tests);
                console.log(opts.additional_gene_tests);
            }
            update_genes();
            save_changes();
        });

        $('#reset_genes').on("click", function () {
            $("#reset_dialog").dialog({
                modal: true,
                buttons: {
                    Yes: function () {
                        newdataset = ptree.copy_dataset(pedcache.current(opts));
                        opts.dataset = newdataset;
                        opts.genes = $.extend(true, [], DEFAULT_geneS);
                        opts.additional_genes = [];
                        ptree.rebuild(opts);
                        update_genes();
                        localStorage.setItem('gene_tests', JSON.stringify(opts.genes));
                        localStorage.setItem('additional_gene_tests', JSON.stringify(opts.additional_genes));
                        $(this).dialog("close");
                    },
                    No: function () {
                        $(this).dialog("close");
                    }
                }
            });
            $("#reset_dialog").html("This deletes all genes besides the ones important for BOADICEA CanRisk prediction and restores the default.");
        });

        $('#restore_boadicea').on('click', function (e) {
            $("#reset_dialog").dialog({
                modal: true,
                buttons: {
                    Yes: function () {
                        newdataset = ptree.copy_dataset(pedcache.current(opts));
                        opts.dataset = newdataset;
                        opts.genes = $.extend(true, [], DEFAULT_GENE_TESTS);
                        ptree.rebuild(opts);
                        update_genes();
                        localStorage.setItem('gene_tests', JSON.stringify(opts.genes));
                        $(this).dialog("close");
                    },
                    No: function () {
                        $(this).dialog("close");
                    }
                }
            });
            $("#reset_dialog").html("This restores all genes important for BOADICEA CanRisk prediction.");
        });
    }

    $('#fh_settings2').html(html_gns);
    update_genes();

    $('#fh_edit_settings2').on("click", function () {
        update_genes();
        $('#fh_settings2').dialog('open');
    });
}