$(document).ready(function() {

    /**
     * модалки
     * select
     *  required - признак для необходимого к заполнению поля
     *  data-renewal - признак обновления списка options поля при каждом открытии модалки, нужно поле data-sql
     *  data-sql  - тип источника данных
     *      - selected-fields - из списка выбранных в селект полей
     *      - table-fields    - все поля таблиц, которые есть в from
     *      - all-fields      - вообще все поля
     *      - all-tables      - все доступные таблицы
     *  name - field  - поле
     *       - operator - ( > < = ... )
     *       - value  - значение
     *       - binder - AND / OR
     *       - table  - таблица
     *       - table-field - поле из таблицы выше
     */

    // @TODO: locales / @TODO: locals

    $('.generate_sql').on('click', '.card_destroy_button', function(e) {
        let message = $(e.target).attr('data-destroy-confirm');
        if (message && !confirm(message)) {
            return false;
        }
        $(e.target).parent('[data-element="card"]').remove();
        generate_sql_refresh_result();
    });

    $('.generate_sql').on('click', '.card_destroy_button i', function(e) {
        $(e.target).parent('a.card_destroy_button').trigger('click');
    });

    if ($('#generated_sql_result').length > 0 || $('.sql_pieces').length > 0) {
        // инициализирую селекты в модалках
        $('.generate_sql .modal .select2').each(function () {
            $(this)
              .wrap('<div class="position-relative"></div>')
              .select2({
                  placeholder: 'Выберите группу',
                  dropdownParent: $(this).parent(),
                  language: 'ru'
              });
        });

        if ($('.sql-join-input').length > 0) load_join_from_input();
        if ($('.sql-where-input').length > 0) load_where_from_input();
        if ($('.sql-group-input').length > 0) load_group_from_input();
        if ($('.sql-order-input').length > 0) load_order_from_input();
        if ($('.sql-limit-input').length > 0) load_limit_from_input();
        if ($('.data-mart-sequence-input').length > 0) load_data_mart_sequence_from_input();

        // @todo 2 инициализации обернуть в if существования дерева
            // инициализация обновления SQL по обновлению дерева (селект/деселект)
            $('.jstree-multiple-input').change(function (e) {
                generate_sql_refresh_result();
            });

            // инициализация обновления SQL по перезагрузки дерева
            $('div.tree_input_container').change(function (e) {
                setTimeout(function () {
                    generate_sql_refresh_result();
                }, 75);
            });

            // частное дополнение
            if ( $('[data-container="data-mart-sequence"]')[0] ) {
                Sortable.create($('[data-container="data-mart-sequence"]')[0], {
                    animation: 150,
                    onEnd: save_data_mart_sequence_to_input
                });
            }

            // частное дополнение
            $('#execution_restriction_nsi_select').change(function (e) {
                $('div[data-for="data-mart-sequence"]').addClass('d-none');
                if ($('div[data-for="execution-restriction"]').hasClass('d-none')) return;
                $(`div[data-for="data-mart-sequence"][data-for-execution-restriction="${e.target.value}"]`).removeClass('d-none');
            });

        // open modal - инициализация всех инпутов открывающийся модалки
        $('.generate_sql [data-toggle="modal"]').click(function(e){
            let modal = $( $(e.target).attr('data-target') );

            modal.find(':input').each(function () { $(this).val(null) });
            modal.find('.modal-body .text-danger').remove();

            modal.find('form').attr('data-piece-id', null);
            modal.find('select').prop('selectedIndex', 0).change();
            modal.find('select[data-renewal] option[value]').remove();
            modal.find('input[data-renewal]').val('');
            modal.find('textarea').val('');

            modal.find('select[data-sql]').each(function(e){
                $(this).append(generate_sql_get_options( $(this).data('sql') ));
            });

            if (modal.attr('id') == 'modals-j') {
                generate_sql_modal_join_init_table_change(modal)
            }
            if (modal.attr('id') == 'modals-w') {
                modal.find('input[name="default_value"]').val('');
                modal.find('input[name="parameter"]').prop('checked', true);
                modal.find('input[name="parameter"]').trigger('click');
                modal.find('input[name="operator"]').trigger('change');
            }
            if (modal.attr('id') == 'modals-o') {
                modal.find('input[name="direction"]').prop( "checked", false );
            }
        });

        $('body').on('click', '.generate_sql .edit-piece[data-target="#modals-w"]', function(e){
            let modal = $( $(e.currentTarget).attr('data-target') );
            let piece = $(e.target).parents('[data-element="piece"]');

            modal.find('select[data-sql]').each(function(e){
                $(this).find('option[value]').remove();
                $(this).trigger('change');
                $(this).append(generate_sql_get_options( $(this).data('sql') ));
            });
            modal.find('form').attr('data-piece-id', piece.attr('id'));
            modal.find('select[name="field"]').val(piece.attr('data-sql-field')).trigger('change');
            modal.find('select[name="operator"]').val(piece.attr('data-sql-operator')).trigger('change');
            modal.find('select[name="binder"]').val(piece.attr('data-sql-binder')).trigger('change');
            modal.find('input[name="value"]').val(piece.attr('data-sql-value'));
            modal.find('input[name="default_value"]').val(piece.attr('data-sql-default-value'));

            if (piece.attr('data-sql-parameter') == 'true') {
                modal.find('input[name="parameter"]').prop('checked', true);
            } else {
                modal.find('input[name="parameter"]').prop('checked', false);
            }

            $('#modals-w [name="parameter_trigger"]').trigger('click');
        });


        // модалка where - переключатель "параметризация"
        $('#modals-w input[name="parameter"]').on('click', function(e){
            $('#modals-w select[name="field"]').trigger('change');
            $('#modals-w [name="parameter_trigger"]').trigger('click');
        });

        // модалка where - селектор "оператор"
        $('#modals-w select[name="operator"]').on('change', function(e){
            $('#modals-w [name="parameter_trigger"]').trigger('click');
        });

        $('#modals-w [name="parameter_trigger"]').on('click', function(e){
            let modal = $(e.target).closest('.modal');
            let parameter = modal.find('input[name="parameter"]');

            if (parameter.prop('checked')) {
                modal.find('input[name="default_value"]').prop('disabled', false);
                modal.find('input[name="value"]').addClass('d-none'); // .val('?')

                modal.find('#modals-w-operator-select option[data-disable="parameter"]').prop('disabled', true);
                if ( modal.find('#modals-w-operator-select option:selected').data('disable') == 'parameter') {
                    modal.find('#modals-w-operator-select').val([]).trigger('change');
                }
            } else {
                modal.find('input[name="value"]').prop('disabled', false).removeClass('d-none');
                modal.find('input[name="default_value"]').prop('disabled', 'disabled');

                modal.find('#modals-w-operator-select option[data-disable="parameter"]').prop('disabled', false);
                if ( modal.find('#modals-w-operator-select option:selected').data('child-block') == 'value') {
                    modal.find('input[name="value"]').val('').prop('disabled', 'disabled').removeAttr('required');
                } else {
                    modal.find('input[name="value"]').prop('disabled', false).attr('required', 'required');
                }
            }
        });

        $('body').on('click', '.generate_sql .edit-piece[data-target="#modals-j"]', function(e){
            let modal = $( $(e.currentTarget).attr('data-target') );
            let piece = $(e.target).parents('[data-element="piece"]');

            modal.find('select[data-sql]').each(function(e){
                $(this).find('option[value]').remove();
                $(this).trigger('change');
                $(this).append(generate_sql_get_options( $(this).data('sql') ));
            });
            modal.find('form').attr('data-piece-id', piece.attr('id'));
            modal.find('select[name="table"]').val(piece.attr('data-sql-table')).trigger('change');
            modal.find('select[name="table-field"]').val(piece.attr('data-sql-table-field')).trigger('change');
            modal.find('select[name="field"]').val(piece.attr('data-sql-field')).trigger('change');
            modal.find('select[name="connection"]').val(piece.attr('data-sql-connection')).trigger('change');
        });

        // модалка join - селектор 'тип join-а'
        $('#modals-j select[name="connection"]').on('change', function(e){
            if ($(e.target).val() == 'CROSS JOIN') {
                $('#modals-j-table-field-select').closest('div[data-input-field]').removeAttr('required');
                $('#modals-j-field-select').closest('div[data-input-field]').removeAttr('required');
                $('#modals-j-table-field-select').attr('disabled', 'disabled');
                $('#modals-j-field-select').attr('disabled', 'disabled');
                $('#modals-j-table-field-select').val([]).trigger('change');
                $('#modals-j-field-select').val([]).trigger('change');
            } else {
                $('#modals-j-table-field-select').closest('div[data-input-field]').attr('required', 'required');
                $('#modals-j-field-select').closest('div[data-input-field]').attr('required', 'required');
                $('#modals-j-table-field-select').removeAttr('disabled');
                $('#modals-j-field-select').removeAttr('disabled');
            }
        })

        $('#modals-w select[name="operator"]').on('change', function(e){
            if ( $('#modals-w').find('#modals-w-operator-select option:selected').data('child-block') == 'value') {
                $('#modals-w input[name="value"]').val('').prop('disabled', 'disabled').prop('required', false);
                $('#modals-w input[name="value"]').next('.text-danger').remove();
            } else {
                $('#modals-w input[name="value"]').prop('disabled', false).prop('required', true);
            }
        });

        $('body').on('click', '.generate_sql .edit-piece[data-target="#modals-g"]', function(e){
            let modal = $( $(e.currentTarget).attr('data-target') );
            let piece = $(e.target).parents('[data-element="piece"]');

            modal.find('select[data-sql]').each(function(e){
                $(this).find('option[value]').remove();
                $(this).trigger('change');
                $(this).append(generate_sql_get_options( $(this).data('sql') ));
            });
            modal.find('form').attr('data-piece-id', piece.attr('id'));
            modal.find('select[name="field"]').val(piece.attr('data-sql-field')).trigger('change');
        });

        $('body').on('click', '.generate_sql .edit-piece[data-target="#modals-o"]', function(e){
            let modal = $( $(e.currentTarget).attr('data-target') );
            let piece = $(e.target).parents('[data-element="piece"]');

            modal.find('select[data-sql]').each(function(e){
                $(this).find('option[value]').remove();
                $(this).trigger('change');
                $(this).append(generate_sql_get_options( $(this).data('sql') ));
            });
            modal.find('form').attr('data-piece-id', piece.attr('id'));
            modal.find('select[name="field"]').val(piece.attr('data-sql-field')).trigger('change');

            if (piece.attr('data-sql-direction') == 'DESC') {
                modal.find('input[name="direction"]').prop( "checked", true );
            } else {
                modal.find('input[name="direction"]').prop( "checked", false );
            }
        });

        // apply modal - применить значения в модалке
        $('.generate_sql .modal [data-apply="modal"]').click(function(e){
            let modal = $(e.target).closest('.modal');
            modal.find('.text-danger').remove();
            let is_error = false;

            for (var i = 0, len = modal.find('form [required]').length; i < len; i++) {
                required_field = $(modal.find('form [required]')[i]);

                if ($(required_field.data('input-field')).length > 0) {
                    value_field = $(required_field.data('input-field'));
                } else {
                    value_field = required_field;
                }

                if ((value_field.prop('tagName') == 'INPUT' && value_field.val() == '') ||
                    (value_field.prop('tagName') == 'TEXTAREA' && value_field.val() == '') ||
                    (value_field.prop('tagName') == 'SELECT' && value_field.prop('selectedIndex') < 1)) {
                    is_error = true;
                    required_field.after($('#error_span').html());
                }
            }

            if (is_error) {
                return false;
            }

            generate_sql_modal_apply(modal);
            modal.modal('hide');
        });

        // ПРИНЯТЬ SQL
        $('#apply_sql_result').click(function(e) {
            $('.generate_sql_result_input').val( $( $('#generated_sql_result').html() ).text() );
            sqlAkaTextareaRead();
        });

        // переключатель формата - @todo интересно, не убрали ли этот переключатель со страницы
        $('[name="btn_format_switcher"]').change(function(e){
            if ($(e.target).val() == 'sql') {
                $('#tab_generate_sql').hide();
            } else {
                $('#tab_generate_sql').show();
            }
        });

        // поля LIMIT & OFFSET
        $('[data-container="limit"] input').on('focusout', function() {
            // - убрать ошибки в блоке
            $('[data-container="limit"] div.error-message').addClass('d-none');
            $('[data-container="limit"] input[data-element]').data('valid', true);

            let limit_value = $('[data-container="limit"] input[data-element="limit"]').val().trim()
            let offset_value = $('[data-container="limit"] input[data-element="offset"]').val().trim()

            // - если limit пустой, а offset заполнен - ошибка пустого лимита
            if (!limit_value && offset_value) {
                $('[data-container="limit"] input#sql-construct-offset').data('valid', false);
                $('[data-container="limit"] div#warning_from_empty_field').removeClass('d-none');
            }

            // - проверка по регуляркам значений в limit не должно быть пробела
            if (limit_value && ! /^\S*$/.test(limit_value)) {
                $('[data-container="limit"] input#sql-construct-limit').data('valid', false);
                $('[data-container="limit"] div#warning_from_incorrect_limit').removeClass('d-none');
            }

            // - проверка по регуляркам значений в offset не должно быть пробела
            if (offset_value && ! /^\S*$/.test(offset_value)) {
                $('[data-container="limit"] input#sql-construct-offset').data('valid', false);
                $('[data-container="limit"] div#warning_from_incorrect_offset').removeClass('d-none');
            }

            generate_sql_refresh_result()
        });
    }


    //-------------------------

    // custom инициализатор - фильтр полей по выбранной таблице
    function generate_sql_modal_join_init_table_change(modal) {
        modal.find('select[data-sql="all-tables"]').change(function(e){
            let table = $(this).val();
            let selector = modal.find('select[data-sql="all-fields"]');

            selector.prop('selectedIndex', 0).change();
            selector.find('option[value]').remove();
            selector.append(generate_sql_fields_selected_tables_as_options( [table] ));
        });
    }

//  --- vvv ------------ ADAPTOR OF DATA  ------------ vvv ---
    function jstree_elements_by_kind(kind) {
        return Object.values($('#jstree-block').jstree()._model.data)
                     .filter(e => e['data'] && e['data']['kind'] == kind)
    }

    function gon_generate_sql_tables() {
        if ($('#jstree-block[data-lazy-load-url]').length > 0) {
            return $.map(jstree_elements_by_kind('table'), function(e){ return e['data']});
        }
        if (gon['generate_sql_tables'] == null) {
            return [];
        }

        return gon.generate_sql_tables;
    }
    function gon_generate_sql_fields() {
        if ($('#jstree-block[data-lazy-load-url]').length > 0) {
            return $.map(jstree_elements_by_kind('attribute'), function(e){ return e['data']});
        }

        if (gon['generate_sql_fields'] == null) {
            return [];
        }

        return gon.generate_sql_fields;
    }

//  --- VVV ------------- SOURCE OF DATA  ------------ VVV ---
    // custom - selected fields not from select-cards, but from jstree
    function generate_data_mart_sequence() {
        let selected_data_mart_version_ids = _.uniq(Object.values($('#jstree-block').jstree()._model.data)
            .filter(e => e['data'] && e['data']['kind'] == 'attribute' && e['state']['selected'] == true)
            .map(e => e['data']['data_mart_version_id']));

        let selected_data_mart_versions = Object.values($('#jstree-block').jstree()._model.data)
            .filter(e => e['data'] && e['data']['kind'] == 'data_mart_version' && selected_data_mart_version_ids.indexOf(e['data']['data_mart_version_id']) > -1)
            .map(e => Object.create({ id: e['data']['data_mart_version_id'],
                code: e['data']['data_mart_version_code'],
                mnemonic: e['data']['data_mart_mnemonic'],
                name: e['text']}));

        let changed = false;
        let actual_mnemonics = [];

        for (var data_mart of selected_data_mart_versions) {
            actual_mnemonics.push(data_mart.mnemonic);
            if (add_data_mart_sequence_html(data_mart.mnemonic, data_mart.code, data_mart.name)) changed = true;
        }

        if (selected_data_mart_versions.length < $('[data-container="data-mart-sequence"] [data-element="piece"]').length) {
            changed = true;
            $('[data-container="data-mart-sequence"] [data-element="piece"]').each(function() {
                if (actual_mnemonics.indexOf($(this).data('mnemonic')) < 0) $(this).remove();
            });
        }

        if (changed == true) save_data_mart_sequence_to_input();

        if (selected_data_mart_versions.length > 1) {
            $('[data-for="execution-restriction"]').removeClass('d-none');
            $('#execution_restriction_nsi_select').prop('required',true);
            $('#execution_restriction_nsi_select').trigger('change');
        } else {
            $('[data-for="execution-restriction"]').addClass('d-none');
            $('#execution_restriction_nsi_select').removeAttr('required');
            $('div[data-for="data-mart-sequence"]').addClass('d-none');
        }

    }

    function generate_sql_get_selected_tables() {
        let selected_ids = $('.tree_block_container').find('.jstree-multiple-input').val();
        if (selected_ids.length == 0) {
            return [];
        }
        let arr_ids = selected_ids.split(',');
        let list = []

        $.each(gon_generate_sql_fields(), function (key, val) {
            if($.inArray(`${val['id']}`, arr_ids) !== -1 ) {
                list.push( `${val['table_label']}` );
            }
        });
        return $.unique(list.sort((a, b) => a - b));
    }

    // custom - selected tables not from from-cards, but from jstree
    function generate_sql_get_selected_fields() {
        let selected_ids = $('.tree_block_container').find('.jstree-multiple-input').val();
        if (selected_ids.length == 0) {
            return [];
        }
        let arr_ids = selected_ids.split(',').sort((a, b) => (parseInt(a) > parseInt(b) ? 1 : -1));

        let list = arr_ids
            .map(selected_element => Object.values(gon_generate_sql_fields()).filter(e => e.id == selected_element)[0])
            .filter(e => e != null)
            .map(e => `${e.table_label}.${e.tech_name}`);

        return list;
    }
//  --- VVV ------------- GET SELECT OPTIONS  ------------ VVV ---

    //  data_sql {selected-fields, table-fields, all-fields, all-tables}
    function generate_sql_get_options(data_sql) {
        let options = '';

        switch(data_sql) {
            case 'selected-fields':
                options = generate_sql_selected_fields_as_options();
                break;
            case 'table-fields':
                options = generate_sql_fields_selected_tables_as_options();
                break;
            case 'all-fields':
                options = generate_sql_all_fields_as_options();
                break;
            case 'all-tables':
                options = generate_sql_all_tables_as_options();
                break;
            case 'selected-tables-all-fields':
                options = generate_sql_selected_data_mart_tables_all_attributes_as_options();
                break;
        }
        return options;
    }

    // custom function
    function generate_sql_selected_fields_as_options() {
        let selected_ids = $('.tree_block_container').find('.jstree-multiple-input').val();
        if (selected_ids.length == 0) {
            return '*';
        }
        let arr_ids = selected_ids.split(',');
        let list = []

        $.each(gon_generate_sql_fields(), function (key, val) {
            if($.inArray(`${val['id']}`, arr_ids) !== -1 ) {
                list.push(
                  `<option value="${val['table_label']}.${val['tech_name']}" data-table="${val['table_label']}" data-attribute-id="${val['id']}" data-field-alias=":${val['table_tech_name']}_${val['tech_name']}">${val['table_tech_name']}.${val['tech_name']} - ${val['name']}</option>`
                );
            }
        });
        return list.join(' ');
    }

    // custom function
    function generate_sql_fields_selected_tables_as_options(selected_tables = []) {
        if (selected_tables.length == 0) {
            selected_tables = generate_sql_get_selected_tables();
        }
        let list = []

        $.each(gon_generate_sql_fields(), function (key, val) {
            if($.inArray(`${val['table_label']}`, selected_tables) !== -1 ) {
                list.push(
                  `<option value="${val['table_label']}.${val['tech_name']}" data-table="${val['table_label']}">${val['table_tech_name']}.${val['tech_name']} - ${val['name']}</option>`
                );
            }
        });
        return list.join(' ');
    }

    // custom function
    function generate_sql_all_fields_as_options() {
        let list = []
        $.each(gon_generate_sql_fields(), function (key, val) {
            list.push(
              `<option value="${val['table_label']}.${val['tech_name']}" data-table="${val['table_label']}" data-field-alias=":${val['table_tech_name']}_${val['tech_name']}">${val['table_tech_name']}.${val['tech_name']} - ${val['name']}</option>`
            );
        });
        return list.join(' ');
    }

    // custom function
    function generate_sql_all_tables_as_options() {
        let list = []
        $.each(gon_generate_sql_tables(), function (key, val) {
            list.push(
              `<option value="${val['table_label']}">${val['table_tech_name']} - ${val['name']}</option>`
            );
        });
        return list.join(' ');
    }

    // custom function
    function generate_sql_selected_data_mart_tables_all_attributes_as_options() {
        let list = []
        $.each( $('#jstree-block').jstree(true).settings.tools.selected_data_mart_table_ids(), function (_i, table_id) {
            $.each( $('#jstree-block').jstree(true).get_node(`t_${table_id}`).children, function (_j, attr_id) {
                let val = $('#jstree-block').jstree(true).get_node(attr_id).data;
                list.push(
                    `<option value="${val.table_label}.${val.tech_name}" data-table="${val.table_label}" data-field-alias=":${val.table_tech_name}_${val.tech_name}">${val.table_tech_name}.${val.tech_name} - ${val.name}</option>`
                );
            });
        });
        return list.join(' ');
    }

//  --- VVV ------------- MODAL APPLY  ------------ ADD CARDS --- VVV ---

    function generate_sql_modal_apply(modal) {
        switch (modal.attr('id')) {
            case 'modals-w':
                generate_sql_add_card_where(modal);
                break;
            case 'modals-g':
                generate_sql_add_card_group(modal);
                break;
            case 'modals-o':
                generate_sql_add_card_order(modal);
                break;
            case 'modals-j':
                generate_sql_add_card_join(modal);
                break;
        }
        generate_sql_refresh_result();
    }

    function generate_sql_add_card_join(modal) {
        add_join_html(modal.find('select[name="table"]').val(),
            modal.find('select[name="table-field"]').val(),
            modal.find('select[name="field"]').val(),
            modal.find('select[name="connection"]').val(),
            modal.find('form').attr('data-piece-id'));
    }

    function alias_field(field_name) {
        var e_arr = field_name.split('.')
        var col_name = e_arr.pop();
        var table_name = e_arr.pop();
        return '"' + table_name + '_' + col_name + '"';
    }

    function add_join_html(table, table_field, field, connection, piece_id = null) {

        let template = $('.generate_sql [data-template="join"]');
        let piece    = template.find('[data-element="piece"]');
        let text = `${connection} ${table}`
        // в случае CROSS JOIN - не добавлять то, что полсе ON
        if (connection != 'CROSS JOIN') {
            text += ` ON ${table_field} = ${field}`;
        }

        piece.find('code').html(text);
        piece.attr('data-sql-table', table);
        piece.attr('data-sql-table-field', table_field);
        piece.attr('data-sql-field', field);
        piece.attr('data-sql-connection', connection);

        if (piece_id == null) {
            $('.generate_sql [data-container="join"]').append(template.html());
        } else {
            $(`#${piece_id}`).replaceWith(piece[0].outerHTML);
        };

        $('.generate_sql [data-container="join"] [data-element="piece"]:not([id])').attr('id', Math.random().toString(36).substr(2, 5));
    }

    function generate_sql_add_card_where(modal) {
        let field, operator, value, parameter, defaultValue, binder, pieceId, dataAttributeId;

        if (modal.find('select[name="binder"]').prop('selectedIndex') > 0) {
            binder = `${modal.find('select[name="binder"]').val()}`
        }

        field = modal.find('select[name="field"]').val();
        operator = modal.find('select[name="operator"]').val();
        value = modal.find('input[name="value"]').val();
        parameter = modal.find('input[name="parameter"]').is(':checked');
        pieceId = modal.find('form').attr('data-piece-id');
        dataAttributeId = modal.find('select[name="field"] option:selected').data('attributeId');

        defaultValue = modal.find('input[name="default_value"]').val();

        add_where_html(field, operator, value, defaultValue, binder, parameter,  pieceId, dataAttributeId);
    }

    function add_where_html(field, operator, value, default_value = '', binder, parameter, piece_id = null, dataAttributeId) {
        let condition = `${field} ${operator} ${value}`;
        let template = $('.generate_sql [data-template="where"]');
        let piece    = template.find('[data-element="piece"]');
        if (!binder) { binder = '' };
        // piece.find('code').html(condition);
        piece.attr('data-sql-main', condition);
        piece.attr('data-sql-binder', binder);
        piece.attr('data-sql-field', field);
        piece.attr('data-sql-operator', operator);
        piece.attr('data-sql-value', value);
        piece.attr('data-sql-default-value', default_value);
        piece.attr('data-sql-parameter', parameter);
        piece.attr('data-sql-data-attribute-id', dataAttributeId);

        if (parameter == 'true' || parameter == true) {
            template.find('.where-default-value').html(default_value);
            template.find('.where-extended').show();
        } else {
            template.find('.where-extended').hide();
        };

        if (piece_id == null) {
            $('.generate_sql [data-container="where"]').append(template.html());
        } else {
            $(`#${piece_id}`).closest('[data-element="card"]').prop('outerHTML', template.html())
        };

        $('.generate_sql [data-container="where"] [data-element="piece"]:not([id])').attr('id', Math.random().toString(36).substr(2, 5));
    }

    function load_join_from_input() {
        let join_input_value = $('.sql-join-input').val();
        if (join_input_value == '' || join_input_value == null) return;

        join_conditions = JSON.parse(join_input_value);

        for (var cond of join_conditions) {
            if (typeof cond.connection == 'undefined') {
                cond.connection = 'INNER JOIN'
            }
            add_join_html(cond.table, cond.table_field, cond.field, cond.connection)
        }

        generate_sql_refresh_result();
    }

    function load_where_from_input() {
        let where_input_value = $('.sql-where-input').val();
        if (where_input_value == '' || where_input_value == null) return;

        where_conditions = JSON.parse(where_input_value);

        for (var cond of where_conditions) {
            add_where_html(cond.field, cond.operator, cond.value, cond.default_value, cond.binder, cond.parameter, null, cond.data_attribute_id)
        }

        generate_sql_refresh_result();
    }

    function load_group_from_input() {
        let group_input_value = $('.sql-group-input').val();
        if (group_input_value == '' || group_input_value == null) return;

        group_conditions = JSON.parse(group_input_value);

        for (var cond of group_conditions) {
            add_group_html(cond.field)
        }

        generate_sql_refresh_result();
    }

    function load_order_from_input() {
        let order_input_value = $('.sql-order-input').val();
        if (order_input_value == '' || order_input_value == null) return;

        order_conditions = JSON.parse(order_input_value);

        for (var cond of order_conditions) {
            if (typeof cond.direction == 'undefined') {
                cond.direction = ''
            }
            add_order_html(cond.field, cond.direction)
        }

        generate_sql_refresh_result();
    }

    function load_limit_from_input() {
        let limit_input_value = $('.sql-limit-input').val();
        if (limit_input_value == '' || limit_input_value == null) return;

        limit_conditions = JSON.parse(limit_input_value);

        if ( limit_conditions['limit'] ) {
            $('[data-container="limit"] input[data-element="limit"]').val( limit_conditions['limit'] )
            $('[data-container="limit"] input[data-element="limit"]').data('valid', true);

            if ( limit_conditions['offset'] ) {
                $('[data-container="limit"] input[data-element="offset"]').val( limit_conditions['offset'] )
                $('[data-container="limit"] input[data-element="offset"]').data('valid', true);
            }
        }

        generate_sql_refresh_result();
    }

    function load_data_mart_sequence_from_input() {
        let data_mart_sequence_input_value = $('.data-mart-sequence-input').val();
        if (data_mart_sequence_input_value == '' || data_mart_sequence_input_value == null) return;

        data_mart_sequences = JSON.parse(data_mart_sequence_input_value);

        for (var data_mart of data_mart_sequences) {
            add_data_mart_sequence_html(data_mart.mnemonic, data_mart.code, data_mart.name)
        }

        if (data_mart_sequences.length > 1) {
            $('[data-for="execution-restriction"]').removeClass('d-none');
            $('#execution_restriction_nsi_select').prop('required',true);
            $('#execution_restriction_nsi_select').trigger('change');
        } else {
            $('[data-for="execution-restriction"]').addClass('d-none');
            $('#execution_restriction_nsi_select').removeAttr('required');
            $('div[data-for="data-mart-sequence"]').addClass('d-none');
        }
    }

    function save_data_mart_sequence_to_input(event) {
        let data_mart_sequences = new Array();

        $('[data-container="data-mart-sequence"] [data-element="piece"]').each(function() {
            data_mart_sequences.push({
                mnemonic: $(this).data('mnemonic'),
                code: $(this).data('code'),
                name: $(this).find('span[data-mart-name]').html()
            })
        });

        $('.data-mart-sequence-input').val(JSON.stringify(data_mart_sequences));
    }

    function generate_sql_add_card_group(modal) {
        add_group_html(modal.find('select[name="field"]').val(), modal.find('form').attr('data-piece-id'));
    }

    function generate_sql_add_card_order(modal) {
        let direction = '';
        if ( modal.find('input[name="direction"]').is(':checked') ) {
            direction = 'DESC'
        }

        add_order_html(modal.find('select[name="field"]').val(),
            direction,
            modal.find('form').attr('data-piece-id'));
    }

    function add_group_html(field, piece_id = null) {
        let template = $('.generate_sql [data-template="group"]');
        let piece    = template.find('[data-element="piece"]');

        piece.find('code').html(field);
        piece.attr('data-sql-field', field);

        if (piece_id == null) {
            $('.generate_sql [data-container="group"]').append(template.html());
        } else {
            $(`#${piece_id}`).replaceWith(piece[0].outerHTML);
        };

        $('.generate_sql [data-container="group"] [data-element="piece"]:not([id])').attr('id', Math.random().toString(36).substr(2, 5));
    }

    function add_order_html(field, direction, piece_id = null) {
        let template = $('.generate_sql [data-template="order"]');
        let piece    = template.find('[data-element="piece"]');

        piece.find('code').html(`${field} ${direction}`);
        piece.attr('data-sql-field', field);
        piece.attr('data-sql-direction', direction);

        if (piece_id == null) {
            $('.generate_sql [data-container="order"]').append(template.html());
        } else {
            $(`#${piece_id}`).replaceWith(piece[0].outerHTML);
        };

        $('.generate_sql [data-container="order"] [data-element="piece"]:not([id])').attr('id', Math.random().toString(36).substr(2, 5));
    }

    function add_data_mart_sequence_html(mnemonic, code, name) {
        if ($(`[data-container="data-mart-sequence"] [data-mnemonic="${mnemonic}"]`).length) {
          return false;
        }

        let template = $('[data-template="data-mart-sequence"]');
        let piece    = template.find('[data-element="piece"]');

        piece.attr('data-mnemonic', mnemonic);
        piece.attr('data-code', code);
        piece.find('span[data-mart-name]').html(name + ' - ' + mnemonic);

        $('[data-container="data-mart-sequence"]').append(template.html());
        return true;
    }

//  --- ^^^ ------------- MODAL APPLY  ------------ ADD CARDS --- ^^^ ---

//  --- VVV ------------- REFRESH RESULT  ------------ REDRAW --- VVV ---

    function generate_sql_refresh_result() {
        let result_sql = [
            generate_sql_get_select(),
            generate_sql_get_from(),
            generate_sql_get_join(),
            generate_sql_get_where(),
            generate_sql_get_group(),
            generate_sql_get_order(),
            generate_sql_get_limit()
        ].filter(function(v) {return v!==''}).join('  ');

        generate_data_mart_sequence();

        if($('#generated_sql_result code').length > 0){
            $('#generated_sql_result code').html($('<textarea/>').html(result_sql).val());
            Prism.highlightElement($('#generated_sql_result code')[0]);
        }
    }

    // custom function
    function generate_sql_get_select() {
        let list = generate_sql_get_selected_fields();
        let fields = list.join(', ');

        if (list.length == 0) {
            list.push( ' * ' );
        } else {
            list = list.map(function(e) {
                return e + ' AS ' + alias_field(e);
            });
        }

        $('.generate_sql [data-container="select"] [data-element="piece"] code').html(fields);
        return 'SELECT ' + list.join(', ');
    }

    // custom function
    function generate_sql_get_from() {
        let list = generate_sql_get_selected_tables();
        if (list.length == 0) {
            list.push( '-' );
        }
        let tables = list.join(', ');

        $('.generate_sql [data-container="from"] [data-element="piece"] code').html(tables);
        return 'FROM ' + tables;
    }

    function generate_sql_get_join() {
        let joins = [];
        $('.generate_sql [data-container="join"] [data-element="card"]').each(function(key){
            joins.push(Prism.highlight($(this).find('[data-element="piece"] code').html(), Prism.languages.sql));
        });
        return joins.join('  ');
    }

    function generate_sql_get_where() {
        $('[data-container="where"] [data-element="card"]').each(function(key){
            let sql_piece = $(this).find('[data-element="piece"]').attr('data-sql-main');
            let binder = 'AND';
            if ($(this).find('[data-element="piece"]').attr('data-sql-binder')) { binder = $(this).find('[data-element="piece"]').attr('data-sql-binder') };

            if ($(this)[0] != $('[data-container="where"] [data-element="card"]').last()[0]) {
                sql_piece += ' ' + binder;
            }
            $(this).find('[data-element="piece"] code').html(` ${sql_piece} `);
        });

        if ($('[data-container="where"] [data-element="card"]').length == 0) {
            return '';
        }
        let wheres = [];
        $('[data-container="where"] [data-element="card"]').each(function(key){
            wheres.push( $(this).find('[data-element="piece"] code').html() );
        });
        return 'WHERE ' + wheres.join(' ');
    }

    function generate_sql_get_group() {
        if ($('[data-container="group"] [data-element="card"]').length == 0) {
            return '';
        }
        let group = [];
        $('[data-container="group"] [data-element="card"]').each(function(key){
            group.push( $(this).find('[data-element="piece"] code').html() );
        });
        return 'GROUP BY ' + group.join(', ');
    }

    function generate_sql_get_order() {
        if ($('[data-container="order"] [data-element="card"]').length == 0) {
            return '';
        }
        let order = [];
        $('[data-container="order"] [data-element="card"]').each(function(key){
            let piece = $(this).find('[data-element="piece"]');
            order.push(`${piece.data('sql-field')} ${piece.data('sql-direction')}`);
        });
        return 'ORDER BY ' + order.join(', ');
    }

    function generate_sql_get_limit() {
        let limit = [];
        if ($('[data-container="limit"] input[data-element="limit"]').length && $('[data-container="limit"] input[data-element="limit"]').val().trim() &&
            $('[data-container="limit"] input#sql-construct-limit').data('valid') ) {
            limit.push(`LIMIT ${$('[data-container="limit"] input[data-element="limit"]').val()}`)
            if ( $('[data-container="limit"] input[data-element="offset"]').val().trim() &&
                $('[data-container="limit"] input#sql-construct-offset').data('valid') ) {
                limit.push(`OFFSET ${$('[data-container="limit"] input[data-element="offset"]').val()}`)
            }
        }
        return limit.join(' ')
    }

    // ------------- vvv ----------- PARSER SQL ---------- vvv ------------

    if ($('#tab_parse_sql').length > 0) {
        $('#tab_parse_sql').on('click', '#btn_parse_sql', function(e) {
            if ($('#div_parse_sql code').text().trim() == '') {
                parse_sql_show_errors({empty_field: true});
                $('#div_parse_sql code').text(' ')
                return false;
            }

            $('.regulated_query_common_form [data-container="param-input"] [data-element="card"]').each(function (e) {
                if ($(this).find('[data-mnemonic="doctype"]').length == 0) {
                    $(this).remove();
                }
            });

            parse_sql_ajax_load();
        });
    }

    function parse_sql_ajax_load() {
        parse_sql_block_element_block();
        parse_sql_clear_errors();
        $.ajax({
            url: $('#div_parse_sql').data('url'),
            type: 'PUT',
            dataType: 'json',
            data: {query: $('#div_parse_sql code').text()},
            success: function (data, status, msg) {
                $('.generate-sql-block-element').unblock()
                parse_sql_apply_ajax_data(data);
            },
            error: function (data, status, msg) {
                $('.generate-sql-block-element').unblock()
                parse_sql_clear_all_cards();
                parse_sql_show_errors( {common_error: true} );
            }
        });
    }

    function parse_sql_block_element_block() {
        $('.generate-sql-block-element').block({
            message: '<div class="sk-fold sk-primary mx-auto mb-4 mt-5"> <div class="sk-grid sk-primary"><div class="sk-grid-cube"></div><div class="sk-grid-cube"></div><div class="sk-grid-cube"></div><div class="sk-grid-cube"></div><div class="sk-grid-cube"></div><div class="sk-grid-cube"></div><div class="sk-grid-cube"></div><div class="sk-grid-cube"></div><div class="sk-grid-cube"></div></div></div><h5 class="text-body"></h5>',
            css: {
                backgroundColor: 'transparent',
                border: '0'
            },
            overlayCSS:  {
                backgroundColor: '#fff',
                opacity: 0.7
            }
        })
    }

    function parse_sql_apply_ajax_data(data) {
        if ( data.provider_ids ) {
            $('#regulated_query_providers_select').val(data.provider_ids).trigger('change.select2');
        }

        // data.jstree_data --> data.jstree_data && data.selected_ids && data.open_node
        if ( data.jstree_data ) {
            $('#jstree-block').jstree(true).deselect_all()
            $('#jstree-block').jstree(true).close_all()
            let cached_data = $('#jstree-block').jstree(true).settings.core.data
            $('#jstree-block').jstree(true).settings.core.data = data.jstree_data;

            // возможно нужные строки, если отображение в дереве не будет работать
            // @todo при стабильной работе - убрать
            // let multiple_input = $('#jstree-block').closest('.tree_block_container').find('.jstree-multiple-input');
            // multiple_input.val(data.selected_ids)
            // multiple_input.trigger('change');

            setTimeout(function () {
                $('#jstree-block').jstree(true).open_node(data.open_node);
                $('#jstree-block').jstree(true).select_node(data.selected_ids) // , true, true) // возможно полезные параметры
            }, 100); // 5-15 граничные значения на локале. Берем с небольшим запасом

            $('#jstree-block').jstree(true).refresh();
            // $('#jstree-block').jstree().redraw();

            $('#jstree-block').jstree(true).settings.core.data = cached_data;
        }

        parse_sql_clear_all_cards();

        if ( data.input_common_params ) {
            $(`.regulated_query_common_form [data-id="input_params"]`).val(JSON.stringify(data.input_common_params));
            $(`.regulated_query_common_form [data-id="input_params"]`).trigger('change');
        }

        if ( data.sql_where ) {
            $.each(data.sql_where, function(key, e) {
                add_where_html(
                    e['field'],
                    e['operator'],
                    e['value'],
                    e['default_value'],
                    e['binder'],
                    e['parameter'],
                    null,
                    e['data_attribute_id']);
            });
        }

        if ( data.sql_join ) {
            $.each(data.sql_join, function(key, e) {
                add_join_html(e['table'], e['table_field'], e['field'], e['connection']);
            });
        }

        if ( data.sql_group ) {
            $.each(data.sql_group, function(key, e) {
                add_group_html(e['field']);
            });
        }

        if ( data.sql_order ) {
            $.each(data.sql_order, function(key, e) {
                add_order_html(e['field'], e['direction']);
            });
        }

        if ( data.sql_limit ) {
            if ( data.sql_limit['limit']) {
                $('[data-container="limit"] input[data-element="limit"]').val(data.sql_limit['limit']);

                if ( data.sql_limit['offset'] ) {
                    $('[data-container="limit"] input[data-element="offset"]').val(data.sql_limit['offset'])
                }
            }
        }

        // после всех карточек
        // generate_sql_refresh_result();

        if ( data.errors ) {
            parse_sql_show_errors(data.errors);
        }
    }

    function parse_sql_clear_errors() {
        $('#parse_sql_messages div[id]').addClass('d-none');
        $('#parse_sql_messages').children('div[data-id]').remove();
        $('[data-container="limit"] div.error-message').addClass('d-none');
    }

    function parse_sql_clear_all_cards() {
        // очистить все ранее введенные карточки
        $('.generate_sql [data-container] [data-element="piece"]').each(function (){
            if ($(this).attr('id')) {
                $(this).closest('[data-element="card"]').remove();
            }
        })
        // очистить ЛИМИТ
        $('[data-container="limit"] input[data-element]').data('valid', true).val('');

        generate_sql_refresh_result();
    }

    function parse_sql_show_errors(data = {}) {

        if (data.empty_field) {
            $('#parse_sql_messages div#parser_empty_field').removeClass('d-none');
            return true;
        }

        if (data.not_find_error) {
            $.each(data.not_find_error, function(i, val) {
                template = $('#parse_sql_messages #parser_not_find_element')
                template.find('div small b').html(val);
                $('#parse_sql_messages').append(template.html());
            });
        }

        if (data.extra_error) {
            $('#parse_sql_messages div#parser_extra_error').removeClass('d-none');
        }

        if (data.common_error || data.parser_error) {
            $('#parse_sql_messages div#parser_common_error').removeClass('d-none');
        }
    }
    // ------------- ^^^ ----------- PARSER SQL ---------- ^^^ ------------

});
