// pedigree widgets
(function (widgets, $, undefined) {

	function getTranslation(transform) {
		// Create a dummy g for calculation purposes only. This will never
		// be appended to the DOM and will be discarded once this function
		// returns.
		var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

		// Set the transform attribute to the provided string value.
		g.setAttributeNS(null, "transform", transform);

		// consolidate the SVGTransformList containing all transformations
		// to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
		// its SVGMatrix.
		var matrix = g.transform.baseVal.consolidate().matrix;

		// As per definition values e and f are the ones for the translation.
		return [matrix.e, matrix.f];
	}

	function openEditNode(opts, data, windowname) {
		openEditDialog(opts, { 'data': data }, windowname);
	}

	var dragging;
	var last_mouseover;
	//
	// Add widgets to nodes and bind events
	widgets.addWidgets = function (opts, node) {

		// popup gender selection box
		var font_size = parseInt($("body").css('font-size'));
		var popup_selection = d3.select('.diagram');
		popup_selection.append("rect").attr("class", "popup_selection")
			.attr("rx", 6)
			.attr("ry", 6)
			.attr("transform", "translate(-1000,-100)")
			.style("opacity", 0)
			.attr("width", font_size * 7.9)
			.attr("height", font_size * 2)
			.style("stroke", "darkgrey")
			.attr("fill", "white");

		var square = popup_selection.append("text")  // male
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.2em')
			.attr("class", "popup_selection fa-lg fa-square persontype")
			.attr("transform", "translate(-1000,-100)")
			.attr("x", font_size / 3)
			.attr("y", font_size * 1.5)
			.text("\uf096 ");
		var square_title = square.append("svg:title").text("Add male");

		var circle = popup_selection.append("text")  // female
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.2em')
			.attr("class", "popup_selection fa-lg fa-circle persontype")
			.attr("transform", "translate(-1000,-100)")
			.attr("x", font_size * 1.7)
			.attr("y", font_size * 1.5)
			.text("\uf10c ");
		var circle_title = circle.append("svg:title").text("Add female");

		var unspecified = popup_selection.append("text")  // unspecified
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.2em')
			.attr("transform", "translate(-1000,-100)")
			.attr("class", "popup_selection fa-lg fa-unspecified popup_selection_rotate45 persontype")
			.text("\uf096 ");
		var unspecified_title = unspecified.append("svg:title").text("Add unspecified");

		var dztwin = popup_selection.append("text")  // dizygotic twins
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr("transform", "translate(-1000,-100)")
			.attr("class", "popup_selection fa-2x fa-angle-up persontype dztwin")
			.attr("x", font_size * 4.6)
			.attr("y", font_size * 1.5)
			.text("\uf106 ");
		var dztwin_title = dztwin.append("svg:title").text("Add dizygotic/fraternal twins");

		var mztwin = popup_selection.append("text")  // monozygotic twins
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr("transform", "translate(-1000,-100)")
			.attr("class", "popup_selection fa-2x fa-caret-up persontype mztwin")
			.attr("x", font_size * 6.2)
			.attr("y", font_size * 1.5)
			.text("\uf0d8");
		var mztwin_title = mztwin.append("svg:title").text("Add monozygotic/identical twins");

		var add_person = {};
		// click the person type selection
		d3.selectAll(".persontype")
			.on("click", function () {
				var newdataset = ptree.copy_dataset(pedcache.current(opts));
				var mztwin = d3.select(this).classed("mztwin");
				var dztwin = d3.select(this).classed("dztwin");
				var twin_type;
				var sex;
				if (mztwin || dztwin) {
					sex = add_person.node.datum().data.sex;
					twin_type = (mztwin ? "mztwin" : "dztwin");
				} else {
					sex = d3.select(this).classed("fa-square") ? 'M' : (d3.select(this).classed("fa-circle") ? 'F' : 'U');
				}

				if (add_person.type === 'addsibling') {
					var newsibling = ptree.addsibling(newdataset, add_person.node.datum().data, sex, false, twin_type);
					if (!pbuttons.is_fullscreen()) {openEditNode(opts, newsibling, 'Sibling');};
				} else if (add_person.type === 'addchild') {
					var newchildren = ptree.addchild(newdataset, add_person.node.datum().data, (twin_type ? 'U' : sex), (twin_type ? 2 : 1), twin_type);
					// if more than 1 child, open edit dialogue 2 times
					if (!twin_type) {
						if (!pbuttons.is_fullscreen()) {openEditNode(opts, newchildren[0], 'Child');};
					} else {
						if (!pbuttons.is_fullscreen()) {openEditNode(opts, newchildren[0], 'Child 1');};
						$('#node_properties').on('dialogclose', function (e) {
							if (!pbuttons.is_fullscreen()) {openEditNode(opts, newchildren[1], 'Child 2');};
							$('#node_properties').unbind('dialogclose');
						});
					}
				}
				else
					return;
				opts.dataset = newdataset;
				ptree.rebuild(opts);
				d3.selectAll('.popup_selection').style("opacity", 0);
				add_person = {};
			})
			.on("mouseover", function () {
				if (add_person.node)
					add_person.node.select('rect').style("opacity", 0.2);
				d3.selectAll('.popup_selection').style("opacity", 1);
				// add tooltips to font awesome widgets
				if (add_person.type === 'addsibling') {
					if (d3.select(this).classed("fa-square"))
						square_title.text("add brother");
					else
						circle_title.text("Add sister");
				} else if (add_person.type === 'addchild') {
					if (d3.select(this).classed("fa-square"))
						square_title.text("Add son");
					else
						circle_title.text("Add daughter");
				}
			});

		// handle mouse out of popup selection
		d3.selectAll(".popup_selection").on("mouseout", function () {
			// hide rect and popup selection
			if (add_person.node !== undefined && highlight.indexOf(add_person.node.datum()) == -1)
				add_person.node.select('rect').style("opacity", 0);
			d3.selectAll('.popup_selection').style("opacity", 0);
		});


		// drag line between nodes to create partners
		drag_handle(opts);

		// rectangle used to highlight on mouse over
		node.append("rect")
			.filter(function (d) {
				return d.data.hidden && !opts.DEBUG ? false : true;
			})
			.attr("class", 'indi_rect')
			.attr("rx", 6)
			.attr("ry", 6)
			.attr("x", function (d) { return - 0.75 * opts.symbol_size; })
			.attr("y", function (d) { return - opts.symbol_size; })
			.attr("width", (1.5 * opts.symbol_size) + 'px')
			.attr("height", (2 * opts.symbol_size) + 'px')
			.style("stroke", "black")
			.style("stroke-width", 0.7)
			.style("opacity", 0)
			.attr("fill", "lightgray");

		// widgets
		var fx = function (d) { return off - 0.75 * opts.symbol_size; };
		var fy = opts.symbol_size - 2;
		var off = 0;
		var widgets = {
			'addchild': { 'text': '\uf063', 'title': 'Add child', 'fx': fx, 'fy': fy },
			'addpartner': { 'text': '\uf0c1', 'title': 'Add partner', 'fx': opts.symbol_size * -0.2, 'fy': fy },
			'addsibling': { 'text': '\uf061', 'title': 'Add sibling', 'fx': opts.symbol_size / 2 - 6, 'fy': fy },
			'addparents': {
				'text': '\uf062', 'title': 'Add parents',
				'fx': - 0.75 * opts.symbol_size,
				'fy': - opts.symbol_size + 11
			},
			'delete': {
				'text': 'X', 'title': 'Delete',
				'fx': opts.symbol_size / 2 - 1,
				'fy': - opts.symbol_size + 12,
				'styles': { "font-weight": "bold", "fill": "darkred", "font-family": "monospace" }
			}
		};

		for (var key in widgets) {
			var widget = node.append("text")
				.filter(function (d) {
					return (d.data.hidden && !opts.DEBUG ? false : true) &&
						!((d.data.mother === undefined || d.data.noparents) && key === 'addsibling') &&
						!(d.data.parent_node !== undefined && d.data.parent_node.length > 1 && key === 'addpartner') &&
						!(d.data.parent_node === undefined && key === 'addchild') &&
						!((d.data.noparents === undefined && d.data.top_level === undefined) && key === 'addparents');
				})
				.attr("class", key)
				.style("opacity", 0)
				.attr('font-family', 'FontAwesome')
				.attr("xx", function (d) { return d.x; })
				.attr("yy", function (d) { return d.y; })
				.attr("x", widgets[key].fx)
				.attr("y", widgets[key].fy)
				.attr('font-size', '1.2em')
				.text(widgets[key].text);

			if ('styles' in widgets[key])
				for (var style in widgets[key].styles) {
					widget.attr(style, widgets[key].styles[style]);
				}

			widget.append("svg:title").text(widgets[key].title);
			off += 17;
		}

		// add sibling or child
		d3.selectAll(".addsibling, .addchild")
			.on("mouseover", function () {
				var type = d3.select(this).attr('class');
				d3.selectAll('.popup_selection').style("opacity", 1);
				add_person = { 'node': d3.select(this.parentNode), 'type': type };

				//var translate = getTranslation(d3.select('.diagram').attr("transform"));
				var x = parseInt(d3.select(this).attr("xx")) + parseInt(d3.select(this).attr("x"));
				var y = parseInt(d3.select(this).attr("yy")) + parseInt(d3.select(this).attr("y"));
				d3.selectAll('.popup_selection').attr("transform", "translate(" + x + "," + (y + 5) + ")");
				d3.selectAll('.popup_selection_rotate45')
					.attr("transform", "translate(" + (x + 3 * font_size) + "," + (y + (font_size * 1.2)) + ") rotate(45)");
			});

		// handle widget clicks
		d3.selectAll(".addchild, .addpartner, .addparents, .delete, .indi_rect")
			.on("click", function () {
				d3.event.stopPropagation();
				var opt = d3.select(this).attr('class');
				var d = d3.select(this.parentNode).datum();
				if (opts.DEBUG) {
					console.log(opt);
				}

				var newdataset;
				if (opt === 'indi_rect') {
					if (typeof opts.edit === 'function') {
						opts.edit(opts, d);
					} else {
						openEditDialog(opts, d, '');
					}
				} else if (opt === 'delete') {
					newdataset = ptree.copy_dataset(pedcache.current(opts));
					function onDone(opts, dataset) {
						// assign new dataset and rebuild pedigree
						opts.dataset = dataset;
						ptree.rebuild(opts);
					}
					ptree.delete_node_dataset(newdataset, d.data, opts, onDone);
				} else if (opt === 'addparents') {
					newdataset = ptree.copy_dataset(pedcache.current(opts));
					opts.dataset = newdataset;
					var parents = ptree.addparents(opts, newdataset, d.data.name);
					if (!pbuttons.is_fullscreen()) {openEditNode(opts, parents[0], 'Mother');};
					$('#node_properties').on('dialogclose', function (e) {
						if (!pbuttons.is_fullscreen()) {openEditNode(opts, parents[1], 'Father');};
						$('#node_properties').unbind('dialogclose');
					});
					ptree.rebuild(opts);
				} else if (opt === 'addpartner') {
					newdataset = ptree.copy_dataset(pedcache.current(opts));
					var newpartnerchild = ptree.addpartner(opts, newdataset, d.data.name);
					if (!pbuttons.is_fullscreen()) {openEditNode(opts, newpartnerchild[0], 'Partner');}
					$('#node_properties').on('dialogclose', function (e) {
						if (!pbuttons.is_fullscreen()) {openEditNode(opts, newpartnerchild[1], 'Child');}
						$('#node_properties').unbind('dialogclose');
					});
					opts.dataset = newdataset;
					ptree.rebuild(opts);
				}
				// trigger fhChange event
				$(document).trigger('fhChange', [opts]);
			});

		// other mouse events
		var highlight = [];

		node.filter(function (d) { return !d.data.hidden; })
			.on("click", function (d) {
				if (d3.event.ctrlKey) {
					if (highlight.indexOf(d) == -1)
						highlight.push(d);
					else
						highlight.splice(highlight.indexOf(d), 1);
				} else
					highlight = [d];

				if ('nodeclick' in opts) {
					opts.nodeclick(d.data);
					d3.selectAll(".indi_rect").style("opacity", 0);
					d3.selectAll('.indi_rect').filter(function (d) { return highlight.indexOf(d) != -1; }).style("opacity", 0.5);
				}
			})
			.on("mouseover", function (d) {
				d3.event.stopPropagation();
				last_mouseover = d;
				if (dragging) {
					if (dragging.data.name !== last_mouseover.data.name &&
						dragging.data.sex !== last_mouseover.data.sex) {
						d3.select(this).select('rect').style("opacity", 0.2);
					}
					return;
				}
				d3.select(this).select('rect').style("opacity", 0.2);
				d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 1);
				d3.select(this).selectAll('.indi_details').style("opacity", 0);
				setLineDragPosition(opts.symbol_size - 10, 0, opts.symbol_size - 2, 0, d.x + "," + (d.y + 2));
			})
			.on("mouseout", function (d) {
				if (dragging)
					return;

				d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 0);
				if (highlight.indexOf(d) == -1)
					d3.select(this).select('rect').style("opacity", 0);
				d3.select(this).selectAll('.indi_details').style("opacity", 1);
				// hide popup if it looks like the mouse is moving north
				if (d3.mouse(this)[1] < 0.8 * opts.symbol_size)
					d3.selectAll('.popup_selection').style("opacity", 0);
				if (!dragging) {
					// hide popup if it looks like the mouse is moving north, south or west
					if (Math.abs(d3.mouse(this)[1]) > 0.25 * opts.symbol_size ||
						Math.abs(d3.mouse(this)[1]) < -0.25 * opts.symbol_size ||
						d3.mouse(this)[0] < 0.2 * opts.symbol_size) {
						setLineDragPosition(0, 0, 0, 0);
					}
				}
			});
	};

	// drag line between nodes to create partners
	function drag_handle(opts) {
		var line_drag_selection = d3.select('.diagram');
		var dline = line_drag_selection.append("line").attr("class", 'line_drag_selection')
			.attr("stroke-width", 6)
			.attr("stroke", "black")
			.call(d3.drag()
				.on("start", dragstart)
				.on("drag", drag)
				.on("end", dragstop));
		dline.append("svg:title").text("Drag to create consanguineous partners");

		setLineDragPosition(0, 0, 0, 0);

		function dragstart(d) {
			d3.event.sourceEvent.stopPropagation();
			dragging = last_mouseover;
			d3.selectAll('.line_drag_selection')
				.attr("stroke", "red")
				.style("opacity", 0.7);
		}

		function dragstop(d) {
			if (last_mouseover &&
				dragging.data.name !== last_mouseover.data.name &&
				dragging.data.sex !== last_mouseover.data.sex) {

				var dataset = ptree.copy_dataset(pedcache.current(opts));
				var node1 = pedigree_util.getNodeByName(dataset, dragging.data.name);
				var node2 = pedigree_util.getNodeByName(dataset, last_mouseover.data.name);

				if (pedigree_util.consanguity(node1, node2, opts)) {
					// make partners
					var child = {
						"name": ptree.makeid(4), "sex": 'U',
						"mother": (dragging.data.sex === 'F' ? dragging.data.name : last_mouseover.data.name),
						"father": (dragging.data.sex === 'F' ? last_mouseover.data.name : dragging.data.name)
					};
					newdataset = ptree.copy_dataset(opts.dataset);
					opts.dataset = newdataset;

					var idx = pedigree_util.getIdxByName(opts.dataset, dragging.data.name) + 1;
					opts.dataset.splice(idx, 0, child);
					ptree.rebuild(opts);
				} else {
					$("#conganguity_info").dialog({
						modal: true,
						buttons: {
							OK: function () {
								$(this).dialog("close");
							}
						}
					});
					$("#conganguity_info").html("These partners seem to not be consangious. To identify consangious partners, pleases include the ancestors that indicate consanguity.");
				}
			}
			setLineDragPosition(0, 0, 0, 0);
			d3.selectAll('.line_drag_selection')
				.attr("stroke", "black");
			dragging = undefined;
			return;
		}

		function drag(d) {
			d3.event.sourceEvent.stopPropagation();
			var dx = d3.event.dx;
			var dy = d3.event.dy;
			var xnew = parseFloat(d3.select(this).attr('x2')) + dx;
			var ynew = parseFloat(d3.select(this).attr('y2')) + dy;
			setLineDragPosition(opts.symbol_size - 10, 0, xnew, ynew);
		}
	}

	function setLineDragPosition(x1, y1, x2, y2, translate) {
		if (translate)
			d3.selectAll('.line_drag_selection').attr("transform", "translate(" + translate + ")");
		d3.selectAll('.line_drag_selection')
			.attr("x1", x1)
			.attr("y1", y1)
			.attr("x2", x2)
			.attr("y2", y2);
	}

	/* From here on the purpose of the functions is the dialog to modify the properties of 
	 * single family members.
	 *
	 * The main function here is the 'openEditDialog()', which creates a string, that is
	 * an html table who then gets appended to the '<div/>' of the dialog.
	*/
	function save_update_pedigree(opts) {
		pedigree_form.update(opts);

		// add onchange saving if resulting tree is validated
		$('#node_properties, #node_properties input[type=checkbox], #node_properties input[type=text], #node_properties select').change(function () {
			pedigree_form.save(opts);
		});
	}

	function capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function add_diseases(opts, d, exclude) {
		var updated_diseases = '';

		$.each(opts.diseases, function (k, v) {
			exclude.push(v.type + "_diagnosis_age");
			var diagnosis_age = d.data[v.type + "_diagnosis_age"];

			updated_diseases += "<tr class='default_diseases'><td style='text-align:right'>" +
				"<label class='checkbox-inline'>" +
				v.hpo + "&nbsp;</td><td>" +
				"<input class='form-control age-input disease-age' id='id_" +
				v.type + "_diagnosis_age_0' max='110' min='0' name='" +
				v.type + "_diagnosis_age_0' style='width:5em' type='text' value='" +
				(diagnosis_age != undefined ? diagnosis_age : "") + "'>" +
				"</label></td></tr>";
		});

		$.each(opts.additional_diseases, function (k, v) {
			exclude.push(v.type + "_diagnosis_age");
			var diagnosis_age = d.data[v.type + "_diagnosis_age"];

			updated_diseases += "<tr class='additional_diseases'><td style='text-align:right'>" +
				"<label class='checkbox-inline'>" +
				capitaliseFirstLetter(v.type.replace(/_/g, " ")) + "&nbsp;</td><td>" +
				"<input class='form-control age-input disease-age' id='id_" +
				v.type + "_diagnosis_age_0' max='110' min='0' name='" +
				v.type + "_diagnosis_age_0' style='width:5em' type='text' value='" +
				(diagnosis_age != undefined ? diagnosis_age : "") + "'>" +
				"</label></td></tr>";
		});

		return (updated_diseases);
	}

	function add_genetic_tests(opts, d, exclude) {
		var genetictests = '';

		$.each(opts.gene_tests, function (i, v) {
			exclude.push(v.name + "_gene_test");
			var gene_test = d.data[v.name + "_gene_test"];
			var gene_test_type = (gene_test !== undefined ? gene_test['type'] : "0");
			var gene_test_result = (gene_test !== undefined ? gene_test['result'] : "0");

			genetictests += "<tr><td style='text-align:right;'>" +
				'<label title="' + v.explanation + '">' + v.name.replace(/_/g, " ").toUpperCase() + '</label>' +
				"&nbsp;</td><td>" +
				"<p>Type:</p><select class='selectpicker test-type' id='id_" +
				v.name + "_gene_test_type' name='" +
				v.name + "_gene_test' style='width:10em;'>" +
				"<option value='0'" + (gene_test_type == '0' ? 'selected' : '') + ">Not tested</option>" +
				"<option value='S'" + (gene_test_type == 'S' ? 'selected' : '') + ">Mutation Search</option>" +
				"<option value='T'" + (gene_test_type == 'T' ? 'selected' : '') + ">Direct Gene Test</option>" +
				"</select>" +
				"<p>Result:</p><select class='selectpicker test-result' id='id_" +
				v.name + "_gene_test_result' name='" +
				v.name + "_gene_test'>" +
				"<option value='0'" + (gene_test_result == '0' ? 'selected' : '') + ">No result</option>" +
				"<option value='P'" + (gene_test_result == 'P' ? 'selected' : '') + ">Positive</option>" +
				"<option value='N'" + (gene_test_result == 'N' ? 'selected' : '') + ">Negative</option>" +
				"</select></td></tr>";
		});
		
		
		$.each(opts.additional_gene_tests, function (i, v) {
			exclude.push(v.name + "_gene_test");
			var gene_test = d.data[v.name + "_gene_test"];
			var gene_test_type = (gene_test !== undefined ? gene_test['type'] : "0");
			var gene_test_result = (gene_test !== undefined ? gene_test['result'] : "0");

			genetictests += "<tr><td style='text-align:right;'>" +
				'<label title="' + v.explanation + '">' + v.name.replace(/_/g, " ").toUpperCase() + '</label>' +
				"&nbsp;</td><td>" +
				"<p>Type:</p><select class='selectpicker test-type' id='id_" +
				v.name + "_gene_test_type' name='" +
				v.name + "_gene_test' style='width:10em;'>" +
				"<option value='0'" + (gene_test_type == '0' ? 'selected' : '') + ">Not tested</option>" +
				"<option value='S'" + (gene_test_type == 'S' ? 'selected' : '') + ">Mutation Search</option>" +
				"<option value='T'" + (gene_test_type == 'T' ? 'selected' : '') + ">Direct Gene Test</option>" +
				"</select>" +
				"<p>Result:</p><select class='selectpicker test-result' id='id_" +
				v.name + "_gene_test_result' name='" +
				v.name + "_gene_test'>" +
				"<option value='0'" + (gene_test_result == '0' ? 'selected' : '') + ">No result</option>" +
				"<option value='P'" + (gene_test_result == 'P' ? 'selected' : '') + ">Positive</option>" +
				"<option value='N'" + (gene_test_result == 'N' ? 'selected' : '') + ">Negative</option>" +
				"</select></td></tr>";
		});

		return genetictests;
	}

	function add_pathology_tests(opts, d, exclude) {
		var pathologytests = '';

		$.each(opts.pathology_tests, function (i, v) {
			exclude.push(v.name + "_bc_pathology");

			var pathology_test = (d.data[v.name + "_bc_pathology"] !== undefined ? d.data[v.name + "_bc_pathology"] : "0");

			pathologytests += "<tr><td style='text-align:right'>" +
				'<label title="' + v.explanation + '">' + v.name.replace(/_/g, " ").toUpperCase() + '</label>' +
				"&nbsp;</td><td>" +
				"<select class='selectpicker test-result' id='id_" +
				v.name + "_bc_pathology' name='" +
				v.name + "_bc_pathology'>" +
				"<option value='0'" + (pathology_test == '0' ? 'selected' : '') + ">No result</option>" +
				"<option value='P'" + (pathology_test == 'P' ? 'selected' : '') + ">Positive</option>" +
				"<option value='N'" + (pathology_test == 'N' ? 'selected' : '') + ">Negative</option>" +
				"</select></td></tr>";
		});

		return pathologytests;
	}

	// if opt.edit is set true (rather than given a function) this is called to edit node attributes
	function openEditDialog(opts, d, windowname) {
		$('#node_properties').dialog({
			autoOpen: false,
			title: (d.data.display_name ? d.data.display_name : windowname),
			dialogClass: 'person-dialog',
			width: window.innerWidth * 0.75
		}).css({overflow:"auto"});

		// Header
		var table = "<table id='person_details' class='table'>" +
			"<tr>" +
			"<th>General Info</th>" +
			"<th>Age Of Diagnosis</th>" +
			"<th>Genetic Tests</th>" +
			"<th>Pathology Test</th>" +
			"</tr>" +
			"<tr>" +
			"<td>" +
			"<table>";

		// Identification
		// Stopped displaying unique ID, since it is only used for background functions and onyl confuses the user (to show remove style property)
		table += "<tr style='display: none;'><td>Unique ID </td><td><input class='form-control' type='text' id='id_name' name='name' value=" +
			(d.data.name ? d.data.name : "") + " readonly></td></tr>";
		table += "<tr><td>Individual ID </td><td><input class='form-control' type='text' id='id_display_name' name='display_name' value=" +
			(d.data.display_name ? d.data.display_name : "") + "></td></tr>";

		// Age
		table += "<tr><td>Age </td><td><input class='form-control age-input' type='text' id='id_age' min='0' max='120' name='age' value=" +
			(d.data.age ? d.data.age : "") + "></td></tr>";

		table += "<tr>" +
			"<td>Year Of Birth </td>" +
			"<td>" +
			"<input class='form-control yob-input' id='id_yob_0' name='yob' type='text' value=" + (d.data.yob ? d.data.yob : "") + ">"
		"</td>" +
			"</tr>";

		// alive status = 0; dead status = 1
		table += '<tr><td colspan="2">' +
			'<label class="checkbox-inline"><input type="checkbox" id="dead" name="status" ' +
			(d.data.status == 1 ? "checked" : "") +
			'>&thinsp;Deceased</label>' +
			'</td></tr>';

		// Gender
		table += '<tr><td colspan="2" id="id_sex" style="text-align: left">' +
			'<label class="radio-inline"><input class="radio_sex" type="radio" name="sex" value="M" ' + (d.data.sex === 'M' ? "checked" : "") + '>Male</label>' +
			'<label class="radio-inline"><input class="radio_sex" type="radio" name="sex" value="F" ' + (d.data.sex === 'F' ? "checked" : "") + '>Female</label>' +
			'<label class="radio-inline"><input class="radio_sex" type="radio" name="sex" value="U"' + (d.data.sex === 'U' ? "checked" : "") + '>Unknown</label>' +
			'</td></tr>';

		// ashkenazi
		var ashkn_status = d.data.ashkenazi;
		table += '</td></tr><tr><td colspan="2" style="text-align: left">' +
			'<label class="checkbox-inline">' +
			'<input type="checkbox" id="id_ashkenazi" name=ashkenazi" " value="0" ' + (ashkn_status ? "checked" : "") + '>' +
			'&thinsp;Ashkenazi</label>' +
			'</td></tr>';

		// switches
		var switches = ["adopted_in", "adopted_out", "miscarriage", "stillbirth", "termination"];
		table += '<tr><td colspan="2" style="text-align: left"><strong>Reproduction:</strong></td></tr>';
		table += '<tr><td colspan="2" style="text-align: left">';
		for (var iswitch = 0; iswitch < switches.length; iswitch++) {
			var attr = switches[iswitch];
			if (iswitch === 2)
				table += '</td></tr><tr><td colspan="2">';
			table +=
				'<label class="checkbox-inline checkbox_reproduction"><input type="checkbox" name="reproduction" id="id_' + attr +
				'" name="' + attr + '" value="0" ' + (d.data[attr] ? "checked" : "") + '>&thinsp;' +
				capitaliseFirstLetter((attr === "termination" ? "abortion" : attr).replace('_', ' ')) + '</label>'
		}

		// proband
		var proband_status = d.data.proband;
		table += "<tr><td colspan='2' style='text-align: left'><label>Proband:</label></td></tr>";
		table += "<tr><td colspan='2' style='text-align: left'><input type='checkbox' id='id_proband' name='proband' value=" +
			proband_status + " " + (proband_status ? "checked" : "") + "></td></tr>";

		table += '</td></tr></table></td>';

		//
		var exclude = ["famid", "children", "name", "parent_node", "top_level", "id", "noparents",
			"level", "age", "sex", "status", "display_name", "mother", "father",
			"yob", "mztwin", "dztwin", "ashkenazi", "proband"];
		$.merge(exclude, switches);

		// Diseases
		table += '<td><table id="diseasesColumn">';

		table += add_diseases(opts, d, exclude);

		table += '</table></td>';

		// Genetic Tests
		table += '<td><table>';

		table += add_genetic_tests(opts, d, exclude);

		table += '</table></td>';

		// Pathology tests
		table += '<td><table>';

		table += add_pathology_tests(opts, d, exclude);

		table += '</table></td>';

		table += "</table></tr></table>";

		$('#node_properties').html(table);

		$('#node_properties').dialog('open');

		save_update_pedigree(opts);
		setup_input_validation(d);

		return;
	}

}(window.widgets = window.widgets || {}, jQuery));
