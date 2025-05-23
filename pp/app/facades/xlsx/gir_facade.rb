class Xlsx::GirFacade < ::Nsud::Essentials::Xlsx::BaseResourceFacade

  def initialize(resource = nil, resource_name = nil)
    super
    @resource      ||= Gir.new
    @resource_name ||= Gir.name.underscore
  end

  def filename_suffix
    @resource.code
  end

  def sheets
    {
      gir:          'ИР',
      organization: 'Участники вз.',
      info_sys:     'ИС',
      legal_acts:   'НПА',
      employees:    'Сотрудники',
      restrictions: 'Ограничения',
      acc_objects:  'Объекты КМД',
      smev:         'СМЭВ'
    }
  end

  def sheets_headers
    {
      gir:          ['Полное наименование ИР',
                     'Сокращенное наименование ИР'],
      organization: ['Полное наименование ИР',
                     'ОГРН участника взаимодействия',
                     'ИНН участника взаимодействия',
                     'КПП участника взаимодействия',
                     'Тип участника взаимодействия',
                     'Полное официальное наименование',
                     'Краткое официальное наименование'],
      info_sys:     ['Полное наименование ИР',
                     'Полное наименование ИС',
                     'Краткое наименование ИС',
                     'Наименование оператора ИС',
                     'Цель и назначения системы'],
      legal_acts:   ['Полное наименование ИР',
                     'Наименование документа',
                     'Тип документа',
                     'Номер',
                     'Дата утверждения',
                     'Наименование утвердившего органа'],
      employees:    ['Полное наименование ИР',
                     'Фамилия',
                     'Имя',
                     'Отчество',
                     'Наименование организации',
                     'Должность',
                     'Адрес',
                     'Телефон',
                     'Email'],
      restrictions: ['Полное наименование ИР',
                     'Типы доступности',
                     'Дополнительная информация о доступности'],
      acc_objects:  ['Полное наименование ИР',
                     'Наименование объекта учета',
                     'Наименование родительского объекта КМД',
                     'Описание объекта КМД'],
      smev:         ['Полное наименование ИР',
                     'Наименование вида сведений в СМЭВ 3',
                     'Идентификатор сервиса в СМЭВ 3',
                     'Ссылка на XSD-схему, опубликованную на технологическом портале СМЭВ']
    }
  end

  def sheets_headers_widths
    {
      gir:          [50, 30, 30, 40],
      organization: [50, 30, 30, 30, 30, :auto, 30],
      employees:    [50, 30, 30, 30, 50, :auto, 40, 30, 30],
      info_sys:     [50, 50, 30, :auto, 40],
      acc_objects:  [50, 50, 40, 40],
      legal_acts:   [50, :auto, 30, 20, 20, :auto],
      smev:         [50, 40, 40, :auto]
    }
  end

  def data(sheet_key)
    return [] if @resource.new_record?
    case sheet_key
    when :gir
      [[
         @resource.name,
         @resource.short_name
       ]]
    when :organization
      [[
         @resource.name,
         @resource.organization.ogrn,
         @resource.organization.inn,
         @resource.organization.kpp,
         @resource.organization.org_type_name,
         @resource.organization.name,
         @resource.organization.short_name,
       ]]
    when :employees
      @resource.employees.map do |e|
        [
          @resource.name,
          e.middle_name,
          e.first_name,
          e.last_name,
          e.organization.name,
          e.position,
          e.additional_information,
          e.phone,
          e.email
        ]
      end
    when :info_sys
      @resource.information_systems.map do |inf|
        [
          @resource.name,
          inf.name,
          inf.short_name,
          inf.organization.name,
          inf.description
        ]
      end
    when :acc_objects
      @resource.accounting_objects.map do |obj|
        [
          @resource.name,
          obj.name,
          obj.parent&.name,
          obj.description
        ]
      end
    when :legal_acts
      @resource.legal_acts.map do |la|
        [
          @resource.name,
          la.name,
          la.doc_type_name,
          la.number,
          la.approved_at,
          la.organization.name
        ]
      end
    when :restrictions
      @resource.girs_restrictions.map do |r|
      [
         @resource.name,
         r.gir_restriction_type_name,
         r.description
       ]
      end
    when :smev
      @resource.girs_smevs.map do |smev|
        [
          @resource.name,
          smev.name,
          smev.mnemonic,
          smev.xsd_url
        ]
      end
    else
      []
    end
  end

  def set_styles(sheet_key, sheet)
    sheets_styles[sheet_key] = { number_format: sheet.styles.add_style(format_code: '0') }
  end

  def data_style(sheet_key, sheet)
    case sheet_key
    when :organization
      [nil, sheets_styles[sheet_key][:number_format], nil, nil, nil, nil, nil]
    end
  end

  def data_types(sheet_key, sheet)
    case sheet_key
    when :organization
      [nil, :integer, nil, nil, nil, nil, nil]
    end
  end

end
