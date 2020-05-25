// regex's of the input fields
const regex_number = /[\dn]/; // any number or ENTER
const regex_letters = /^[a-zA-ZäöüßÄÖÜ\n\s]+$/; // any letter of a german keyboard layout

const earliest_yob = 0;
const latest_yob = new Date().getFullYear();

const min_age = 0;
const max_age = 150;

var setup_input_validation = function (d) {
    validation();
    autofill(d);
}

var validation = function () {

    validate_number_input('#id_yob_0', earliest_yob, latest_yob);
    $.each($('.age-input'), function () {
        validate_number_input('#' + this.id, min_age, max_age);
    });

    restrict_diagnosis_age();
    $('#id_age').on('change.restrict', function () {
        restrict_diagnosis_age();
    });
}

var validate_number_input = function (inp, min, max) {
    $(inp).on("keypress", function (e) {
        if (!regex_number.test(e.originalEvent.key)) {
            e.preventDefault();
        }
    });

    $(inp).on("change.range", function (e) {
        if (!$(inp).val() == '') {
            var number = parseInt($(inp).val() + e.originalEvent.key);
            var biggerThan = min <= number;
            var smallerThan = max >= number;
            if (!biggerThan) {
                $(inp).val(min);
            } else if (!smallerThan) {
                $(inp).val(max);
            }
        }
    });
}

var restrict_diagnosis_age = function () {
    $.each($('.disease-age'), function () {
        var max_pat_age = $('#id_age').val();

        if (max_pat_age != '') {
            if (this.value > max_pat_age) {
                this.value = max_pat_age;
            }

            validate_number_input('#' + this.id, min_age, max_pat_age)
        }
    });
}

var autofill = function (d) {
    // block breast cancer 2 if breast cancer is empty
    var bc = $('#id_breast_cancer_diagnosis_age_0');
    var bc2 = $('#id_breast_cancer2_diagnosis_age_0');

    bc2.prop('disabled', bc.val() == '');
    bc.on('change.autofill', function (e) {
        if (this.value == '') {
            bc2.prop('disabled', true);
        } else {
            bc2.prop('disabled', false);
        }
    });

    // sex dependent restriction of possible cancers
    sex_dep_restrictions(d.data.sex);
    $.each($('.radio_sex'), function () {
        $(this).on('change.autofill', function (e) {
            sex_dep_restrictions(this.value);
        });
    })
}

var sex_dep_restrictions = function (sex) {
    var ov_ca = $('#id_ovarian_cancer_diagnosis_age_0');
    var pr_ca = $('#id_prostate_cancer_diagnosis_age_0');
    if (sex == 'M') {
        ov_ca.val('')
        ov_ca.prop('disabled', true);
        pr_ca.prop('disabled', false);
    } else if (sex == 'F') {
        pr_ca.val('')
        pr_ca.prop('disabled', true);
        ov_ca.prop('disabled', false);
    } else {
        pr_ca.prop('disabled', false);
        ov_ca.prop('disabled', false);
    }
}

var get_name_by_ID = function (dataset, id) {
    for (var p = 0; p < dataset.length; p++) {
        if (dataset[p].name == id) {
            return dataset[p].display_name
        }
    }
}

// gets called in pedigree.js ptree.rebuild()
var dataset_validation = function (dataset) {
    var validated = true;
    var error_msg = '';

    function create_err(err) {
        console.error(err);
        return new Error(err);
    }

    // check consistency of parents sex
    var uniquenames = [];
    var famids = [];
    for (var p = 0; p < dataset.length; p++) {
        if (!p.hidden) {
            if (dataset[p].mother || dataset[p].father) {
                var display_name = dataset[p].display_name;
                if (!display_name)
                    display_name = 'unnamed';
                var mother = dataset[p].mother;
                var father = dataset[p].father;
                var mother_name = get_name_by_ID(dataset, dataset[p].mother);
                var father_name = get_name_by_ID(dataset, dataset[p].father);
                if (!mother || !father) {
                    validated = false;
                    error_msg = 'Missing parent for ' + display_name;
                }

                var midx = pedigree_util.getIdxByName(dataset, mother);
                var fidx = pedigree_util.getIdxByName(dataset, father);
                if (midx === -1) {
                    validated = false;
                    error_msg = 'The mother "' + mother_name + '" "' + mother_name + '" of family member "' + display_name + '" is missing from the pedigree.';
                }
                if (fidx === -1) {
                    validated = false;
                    error_msg = 'The father "' + father_name + '" of family member "' + display_name + '" is missing from the pedigree.';
                }
                if (dataset[midx].sex !== "F") {
                    validated = false;
                    error_msg = 'The mother "' + mother_name + '" of family member "' + display_name + '" is not specified as female. All mothers in the pedigree must have sex specified as "F".';
                }
                if (dataset[fidx].sex !== "M") {
                    validated = false;
                    error_msg = 'The father "' + father_name + '" of family member "' + display_name + '" is not specified as male. All fathers in the pedigree must have sex specified as "M".';
                }
            }
        }
        if (!dataset[p].name) {
            validated = false;
            error_msg = display_name + ' has no IndivID.';
        }
        if ($.inArray(dataset[p].name, uniquenames) > -1) {
            validated = false;
            error_msg = 'IndivID for family member "' + display_name + '" is not unique.';
        }
        uniquenames.push(dataset[p].name);

        if ($.inArray(dataset[p].famid, famids) === -1 && dataset[p].famid) {
            famids.push(dataset[p].famid);
        }
    }

    if (famids.length > 1) {
        validated = false;
        error_msg = 'More than one family found: ' + famids.join(", ") + '.';
    }

    return [validated, error_msg];
}