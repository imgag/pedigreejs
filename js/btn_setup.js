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

    // adds the functionality of the disease configuration button
    $('#fh_settings').dialog({
        autoOpen: false,
        title: "Disease Configuration",
        width: 300
    });
    var html_dis = '<div id="disease_table"></div>';

    function make_dis_list(dis_list) {
        list = '';

        $.each(dis_list, function (k, v) {
            var deleteBtn = '<td style="text-align:left;"><label class="btn btn-default btn-file btn-remove" id="delete_disease-' + v.type + '">' +
                '<input type="button" style="display: none;"/>' +
                '<i class="fa fa-minus" aria-hidden="true"></i>' +
                '</label></td>';

            list += "<tr><td style='text-align:center;'>" +
                capitaliseFirstLetter(v.type.replace(/_/g, " ")) + "&nbsp;</td>" +
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

        tab += make_dis_list(opts.diseases);
        tab += make_dis_list(opts.additional_diseases);

        // add a disease button
        tab += '<tr><td>' +
            '<input type="text" class="form-control ui-autocomplete-input" id="dis_name"><datalist id="hpo_list"></datalist></td>' +
            '<td style="text-align:left;">' +
            '<label class="btn btn-default btn-file btn-add-dis">' +
            '<input id="add_disease" type="button" style="display: none;"/>' +
            '<i class="fa fa-plus" aria-hidden="true"></i>' +
            '</label></td></tr>';

        // reset diseases
        tab += '<tr>' +
            '<td style="text-align:center;" colspan="2">' +
            '<label class="btn btn-default btn-file reset-btn">' +
            '<input id="reset_diseases" type="button" style="display: none;"/>' +
            'Restore Default' +
            '</label><label class="btn btn-default btn-file reset-btn">' +
            '<input id="restore_boadicea" type="button" style="display: none;"/>' +
            'Restore BOADICEA' +
            '</label></td></tr>';

        tab += "</table>";
        $('#disease_table').html(tab);

        $('#dis_name').autocomplete({
            minLength: 3,
            source: function (request, response) {
                response(hpo_terms.filter(function (entry) {
                    return entry['sterm'].toLowerCase().includes(request['term'].toLowerCase());
                }).map(function (entry) {
                    return entry['display-name'];
                }));
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
            $("#delete_dialog").html("This will delete '" + capitaliseFirstLetter(this_disease.replace(/_/g, " ")) + "' from the list. Are you sure?");
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
            $("#reset_dialog").html("This deletes all diseases besides the ones important for BOADICEA CanRisk prediction and restores the default.");
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
}